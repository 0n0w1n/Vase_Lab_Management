from datetime import date, datetime
from flask import Blueprint, abort, request
from extensions import db
from models import Request, User, File, Comment, ActivityLog


request_api = Blueprint("request_api", __name__)

MEDIA_TYPES = ("image", "video", "audio")
PRIORITIES = ("low", "medium", "high")
TITLE_MAX = 255

# replace later when the login is finish
PLACEHOLDER_USER_EMAIL = "definate@lab.local"


def current_user():
    return db.session.execute(
        db.select(User).filter_by(Email=PLACEHOLDER_USER_EMAIL)
    ).scalar_one_or_none()


def iso(value):
    # DB timestamps are naive UTC; the "Z" keeps the front from reading them as local time
    return value.isoformat() + "Z" if value else None


def person(user):
    parts = user.UserName.split()
    initials = "".join(p[0] for p in parts[:2]) if len(parts) > 1 else user.UserName[:2]
    return {"name": user.UserName, "initials": initials.upper()}


def summary(req, requester):
    return {
        "id": str(req.RequestID),
        "title": req.RequestTitle,
        "status": req.RequestState,
        "priority": req.RequestPriority,
        "deadline": req.RequestDeadline.date().isoformat() if req.RequestDeadline else None,
        "requestedBy": requester.UserName,
        "assignedTo": req.AprovedBy,
    }


def activity_message(log, req_id, actor):
    if log.Action == "create":
        return f"Request #{req_id} created by {actor.UserName}."
    if log.Action == "delete":
        return f"Request #{req_id} deleted."
    new_state = (log.NewValue or {}).get("RequestState")
    return f"Status changed to {new_state}." if new_state else "Request updated."


def with_requester():
    return db.select(Request, User).join(User, Request.UserID == User.UserID)


@request_api.get("/")
def list_requests():
    rows = db.session.execute(with_requester().order_by(Request.RequestID.desc())).all()
    return [summary(req, user) for req, user in rows]


def parse_new_request(data):
    """Returns (fields, errors); errors are keyed like the New Request form's inputs."""
    errors = {}

    title = str(data.get("title") or "").strip()
    if not title:
        errors["title"] = "Please enter a header."
    elif len(title) > TITLE_MAX:
        errors["title"] = f"Header must be {TITLE_MAX} characters or fewer."

    priority = data.get("priority")
    if priority not in PRIORITIES:
        errors["priority"] = "Please select a priority."

    deadline = None
    try:
        deadline = datetime.strptime(str(data.get("deadline") or ""), "%Y-%m-%d")
    except ValueError:
        errors["deadline"] = "Please select a deadline."
    else:
        if deadline.date() < date.today():
            errors["deadline"] = "Deadline can't be in the past."

    notes = str(data.get("notes") or "").strip() or None

    fields = {
        "RequestTitle": title,
        "RequestDetails": notes,
        "RequestPriority": priority,
        "RequestDeadline": deadline,
    }
    return fields, errors


@request_api.post("/")
def create_request():
    fields, errors = parse_new_request(request.get_json(silent=True) or {})
    if errors:
        return {"errors": errors}, 400

    user = current_user()
    if user is None:
        return {"message": f"No user {PLACEHOLDER_USER_EMAIL} — run `flask seed`."}, 500

    req = Request(**fields, UserID=user.UserID)
    db.session.add(req)
    db.session.flush()  # Assigns RequestID for the log entry

    db.session.add(ActivityLog(
        UserID=user.UserID,
        Action="create",
        EntityType="request",
        EntityID=req.RequestID,
        NewValue={
            "RequestTitle": req.RequestTitle,
            "RequestState": req.RequestState,
            "RequestPriority": req.RequestPriority,
            "RequestDeadline": req.RequestDeadline.date().isoformat(),
        },
    ))
    db.session.commit()  # Request and its log entry land together or not at all

    return {"id": str(req.RequestID)}, 201


@request_api.get("/<int:request_id>")
def get_request(request_id):
    row = db.session.execute(
        with_requester().where(Request.RequestID == request_id)
    ).first()
    if row is None:
        abort(404)
    req, requester = row

    files = db.session.execute(
        db.select(File).where(File.RequestID == request_id).order_by(File.CreatedAt)
    ).scalars()

    logs = db.session.execute(
        db.select(ActivityLog, User)
        .join(User, ActivityLog.UserID == User.UserID)
        .where(ActivityLog.EntityType == "request", ActivityLog.EntityID == request_id)
        .order_by(ActivityLog.CreatedAt.desc(), ActivityLog.LogID.desc())
    ).all()

    comments = db.session.execute(
        db.select(Comment, User)
        .join(User, Comment.UserID == User.UserID)
        .where(Comment.RequestID == request_id)
        .order_by(Comment.CreatedAt, Comment.CommentID)
    ).all()

    # No CreatedAt on Request: the "create" log entry is the submission time
    created = next((log for log, _ in logs if log.Action == "create"), None)

    return {
        **summary(req, requester),
        "submittedAt": iso(created.CreatedAt) if created else None,
        "description": req.RequestDetails or "",
        "attachments": [
            {
                "id": str(f.FileID),
                "name": f.FileName,
                "bytes": f.FileSize or 0,
                "uploadedAt": iso(f.CreatedAt),
                "kind": "media" if (f.FileType or "").split("/")[0] in MEDIA_TYPES else "document",
            }
            for f in files
        ],
        "activity": [
            {
                "id": str(log.LogID),
                "actor": person(user),
                "at": iso(log.CreatedAt),
                "message": activity_message(log, request_id, user),
            }
            for log, user in logs
        ],
        "messages": [
            {
                "id": str(c.CommentID),
                "author": person(user),
                "at": iso(c.CreatedAt),
                "body": c.CommentText,
            }
            for c, user in comments
        ],
    }
