"""Private attachments for existing requests: list, upload and download."""

from flask import Blueprint, Response, current_app, request, send_file
from flask_jwt_extended import current_user, jwt_required
from sqlalchemy.exc import DBAPIError, SQLAlchemyError

from extensions import db
from lib.authUtils import can_read_request_files
from lib.fileUtils import (
    UploadValidationError,
    remove_stored_file,
    resolve_file_path,
    validate_and_save_upload,
)
from lib.requestUtils import iso
from models import ActivityLog, File, Request, RequestAssignment, User


file_api = Blueprint("file_api", __name__)

# Validation details stay in the storage helper; HTTP status codes belong here.
UPLOAD_ERROR_STATUSES = {
    "30": 400,  # Invalid display name.
    "31": 415,  # Unsupported extension.
    "32": 413,  # File exceeds the configured byte limit.
    "34": 400,  # Empty file.
}
CLOSED_STATES = {"close", "reject"}


def _can_add_attachment(user: User, req: Request) -> bool:
    """Owners and managers may add files; other staff retain read access."""
    return req.UserID == user.UserID or user.UserRole in {"admin", "lab_manager"}


def _can_read_files(req: Request) -> bool:
    """Look up the signed-in user's assignment, then apply the file read rule."""
    assignment = db.session.get(RequestAssignment, (req.RequestID, current_user.UserID))
    state = assignment.State if assignment else None
    return can_read_request_files(current_user, req, state)


@file_api.after_request
def normalize_auth_error(response: Response) -> Response:
    """Keep JWT errors consistent without changing the existing API groups."""
    if response.status_code in (401, 422):
        body = response.get_json(silent=True)
        if not isinstance(body, dict) or "errorCode" not in body:
            response.set_data(current_app.json.dumps({
                "errorCode": "10",
                "error": "Authentication failed",
            }))
            response.mimetype = "application/json"

    response.headers["Cache-Control"] = "private, no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@file_api.get("/list/<int:request_id>")
@jwt_required()
def list_files(request_id: int):
    req = db.session.get(Request, request_id)
    if req is None or not _can_read_files(req):
        return {"errorCode": "13", "error": "Not found"}, 404

    files = db.session.scalars(
        db.select(File)
        .where(File.RequestID == request_id)
        .order_by(File.CreatedAt, File.FileID)
    ).all()

    return {
        "items": [{
            "id": item.FileID,
            "name": item.FileName,
            "bytes": item.FileSize,
            "uploadedAt": iso(item.CreatedAt),
        } for item in files],
        "canUpload": (
            _can_add_attachment(current_user, req)
            and req.RequestState not in CLOSED_STATES
        ),
    }


@file_api.post("/upload/<int:request_id>")
@jwt_required()
def upload_file(request_id: int):
    req = db.session.get(Request, request_id)
    if req is None or not _can_read_files(req):
        return {"errorCode": "13", "error": "Not found"}, 404
    if not _can_add_attachment(current_user, req):
        return {"errorCode": "12", "error": "Unauthorized"}, 403
    if req.RequestState in CLOSED_STATES:
        return {"errorCode": "23", "error": "Request is no longer open"}, 400

    if (
        request.mimetype != "multipart/form-data"
        or not request.mimetype_params.get("boundary")
    ):
        return {"errorCode": "20", "error": "Multipart form required"}, 415

    if "file" not in request.files:
        return {"errorCode": "21", "error": "File field missing"}, 400
    parts = list(request.files.items(multi=True))
    if len(parts) != 1 or parts[0][0] != "file" or request.form:
        return {"errorCode": "22", "error": "Exactly one file field required"}, 400

    try:
        stored = validate_and_save_upload(parts[0][1], request_id)
    except UploadValidationError as error:
        return {
            "errorCode": error.code,
            "error": str(error),
        }, UPLOAD_ERROR_STATUSES[error.code]
    except OSError:
        current_app.logger.exception("Cannot store attachment for request %s", request_id)
        return {"errorCode": "40", "error": "Attachment storage failed"}, 500

    commit_started = False
    try:
        record = File(
            FileName=stored.original_name,
            FilePath=stored.relative_path,
            FileSize=stored.size_bytes,
            FileType=stored.mime_type,
            RequestID=request_id,
            UserID=current_user.UserID,
        )
        db.session.add(record)
        db.session.flush()
        file_id = record.FileID
        db.session.add(ActivityLog(
            UserID=current_user.UserID,
            Action="create",
            EntityType="file",
            EntityID=file_id,
            NewValue={
                "RequestID": request_id,
                "FileName": stored.original_name,
                "FileSize": stored.size_bytes,
            },
        ))
        commit_started = True
        db.session.commit()
    except SQLAlchemyError as error:
        current_app.logger.exception("Cannot record attachment for request %s", request_id)
        # A lost connection during COMMIT can hide a successful commit. Keep
        # the bytes in that case so an actual database record remains usable.
        preserve_file = (
            commit_started
            and isinstance(error, DBAPIError)
            and error.connection_invalidated
        )
        try:
            db.session.rollback()
        except SQLAlchemyError:
            preserve_file = True
            current_app.logger.exception("Cannot roll back attachment transaction")

        if preserve_file:
            current_app.logger.error(
                "Attachment requires reconciliation after uncertain transaction: %s",
                stored.relative_path,
            )
        else:
            try:
                remove_stored_file(stored.relative_path)
            except (OSError, ValueError):
                current_app.logger.exception(
                    "Cannot clean up attachment after database failure: %s",
                    stored.relative_path,
                )
        return {"errorCode": "40", "error": "Attachment storage failed"}, 500

    # Capture the ID before commit to avoid another SQL query after success.
    return {"id": file_id}, 201


@file_api.get("/download/<int:file_id>")
@jwt_required()
def download_file(file_id: int):
    record = db.session.get(File, file_id)
    if record is None:
        return {"errorCode": "13", "error": "Not found"}, 404

    req = db.session.get(Request, record.RequestID)
    if req is None or not _can_read_files(req):
        return {"errorCode": "13", "error": "Not found"}, 404
    if not record.FilePath:
        return {"errorCode": "13", "error": "Not found"}, 404

    try:
        path = resolve_file_path(record.FilePath)
    except ValueError:
        current_app.logger.warning("Invalid storage path for attachment %s", file_id)
        return {"errorCode": "13", "error": "Not found"}, 404

    try:
        if not path.is_file():
            current_app.logger.warning("Missing content for attachment %s", file_id)
            return {"errorCode": "13", "error": "Not found"}, 404
        return send_file(
            path,
            as_attachment=True,
            download_name=record.FileName,
            mimetype=record.FileType or "application/octet-stream",
            conditional=False,
            etag=False,
        )
    except FileNotFoundError:
        # The file can disappear between the existence check and open().
        current_app.logger.warning("Missing content for attachment %s", file_id)
        return {"errorCode": "13", "error": "Not found"}, 404
    except OSError:
        current_app.logger.exception("Cannot read attachment %s", file_id)
        return {"errorCode": "40", "error": "Attachment storage failed"}, 500
