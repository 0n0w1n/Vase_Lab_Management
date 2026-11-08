"""API routes for creating, viewing, updating and messaging on requests.

Defines the Flask blueprint that lets the frontend read request data
from the database and submit changes to it.
"""

from collections.abc import Sequence
from datetime import date, datetime
from typing import Any, Optional, Union, cast

from flask import Blueprint, request
from flask_jwt_extended import current_user, jwt_required
from sqlalchemy import func

from VaseLabFlask.extensions import db
from VaseLabFlask.lib.authUtils import STAFF, FILE_MANAGERS, can_read_request, can_read_request_files, can_upload_now
from VaseLabFlask.lib.requestUtils import ASSIGNMENT_STATES, verify_user_input, REQUEST_STATES
from VaseLabFlask.models import ActivityLog, File, Request, RequestAssignment, User

# A JSON body, optionally paired with an HTTP status code
JsonDict = dict[str, Any]
ApiResponse = Union[JsonDict, tuple[JsonDict, int]]
current_user: User

TITLE_MAX = 255
DETAILS_MAX = 2000
MESSAGE_MAX = 1000
PRIORITIES = {"low", "medium", "high"}
CREATE_EXPECTED_KEYS = ["title", "details", "priority", "deadline"]
CAPACITY_EXPECTED_KEYS = ["capacity"]
ASK_EXPECTED_KEYS = ["message"]
EDIT_EXPECTED_KEYS = {"status"}

request_api = Blueprint("request_api", __name__)


def _count_approved(request_id: int) -> int:
    """Return how many TAs have been approved to work on a request."""
    approved = db.session.scalar(
        db.select(func.count())
        .select_from(RequestAssignment)
        .where(RequestAssignment.RequestID == request_id,
               RequestAssignment.State == "Approved")
    )
    return approved or 0


@request_api.get("/list")
@jwt_required()
def get_requests_list() -> list[JsonDict]:
    """Return a list of requests based on the role.

    Return all requests if the user's role is in STAFF roles.
    Otherwise, return only the requests the user created.
    """
    query = (
        db.select(Request, User)
        .join(User, Request.UserID == User.UserID)
        .order_by(Request.RequestID.desc())
    )

    if current_user.UserRole not in STAFF:
        query = query.where(Request.UserID == current_user.UserID)

    rows: Sequence[tuple[Request, User]] = db.session.execute(query).tuples().all()

    result = []
    for req, requester in rows:
        result.append({
            "id": str(req.RequestID),
            "title": req.RequestTitle,
            "status": req.RequestState,
            "priority": req.RequestPriority,
            "deadline": req.RequestDeadline.date().isoformat() if req.RequestDeadline else None,
            "requestedBy": requester.UserFullName,
        })

    return result


@request_api.get("/details/<int:request_id>")
@jwt_required()
def get_request_details(request_id: int) -> ApiResponse:
    """Return the full details of one request, or an error code.

    The call is invalid when the request ID can't be found, or when
    the user is neither the owner of the request nor staff.
    """
    row = db.session.execute(
        db.select(Request, User).join(User, Request.UserID == User.UserID)
        .where(Request.RequestID == request_id)
    ).first()
    if row is None:
        return {"errorCode": "10", "error": "Not found"}, 404

    req: Request = row[0]
    user: User = row[1]

    if not can_read_request(current_user, req):
        return {"errorCode": "11", "error": "Unauthorized"}, 403

    files: Sequence[File] = db.session.execute(
        db.select(File).where(File.RequestID == request_id).order_by(File.CreatedAt)
    ).scalars().all()

    assignments: Sequence[tuple[RequestAssignment, User]] = db.session.execute(
        db.select(RequestAssignment, User)
        .join(User, RequestAssignment.UserID == User.UserID)
        .where(RequestAssignment.RequestID == request_id)
        .order_by(RequestAssignment.DecidedAt)
    ).tuples().all()
    assignees = [
        ta.UserFullName for assignment, ta in assignments
        if assignment.State == "Approved"
    ]
    # The signed-in TA's own ask, so the page can show Work on / Waiting / Approved / Declined
    my_state: Optional[str] = next(
        (assignment.State for assignment, _ in assignments
         if assignment.UserID == current_user.UserID),
        None,
    )

    file_list: list[JsonDict] = []
    # Unapproved TAs may see the request but not its attachments
    if can_read_request_files(current_user, req, my_state):
        for file in files:
            created_at = file.CreatedAt.isoformat() + "Z" if file.CreatedAt else None
            file_list.append({
                "id": file.FileID,
                "name": file.FileName,
                "bytes": file.FileSize or "Unknown",
                "uploadedAt": created_at,
            })

    return {
        "id": str(req.RequestID),
        "title": req.RequestTitle,
        "details": req.RequestDetails,
        "status": req.RequestState,
        "priority": req.RequestPriority,
        "deadline": req.RequestDeadline.date().isoformat(),
        "requestedBy": user.UserFullName,
        "submittedAt": req.CreatedAt.isoformat() + "Z" if req.CreatedAt else None,
        "capacity": req.Capacity,
        "assignedCount": len(assignees),
        "assignees": assignees,
        "myAsk": ASSIGNMENT_STATES.get(my_state),
        "files": file_list,
        "canUpload": can_upload_now(current_user, req),
    }


def _validate_request_text(user_input: JsonDict) -> Optional[ApiResponse]:
    """Check the title, details and priority of a new request.

    Returns an error response if a field is invalid, otherwise None.
    """
    if len(user_input["title"]) > TITLE_MAX:
        return {"errorCode": "30", "error": "Title is too long"}, 400
    if len(user_input["details"]) > DETAILS_MAX:
        return {"errorCode": "31", "error": "Details are too long"}, 400
    if user_input["priority"] not in PRIORITIES:
        return {"errorCode": "32", "error": "Invalid priority"}, 400
    return None


@request_api.post("/create")
@jwt_required()
def create_request() -> ApiResponse:
    """Validate the submitted form and save a new request to the database.

    Returns a JSON response with the new request ID, or an error
    message and 400 status if the input is invalid.
    """
    user_id: int = current_user.UserID
    raw_input = request.get_json(silent=True)

    result = verify_user_input(raw_input, CREATE_EXPECTED_KEYS)
    if result[1] != 200:
        return result
    # verify_user_input has confirmed the body is a JSON object with every expected key
    user_input = cast(JsonDict, raw_input)

    error = _validate_request_text(user_input)
    if error is not None:
        return error

    try:
        deadline = datetime.strptime(user_input["deadline"], "%Y-%m-%d")
    except ValueError:
        return {"errorCode": "33", "error": "Invalid date format"}, 400
    if deadline.date() < date.today():
        return {"errorCode": "34", "error": "Invalid date"}, 400

    req = Request(
        RequestTitle=user_input["title"],
        RequestDetails=user_input["details"],
        RequestPriority=user_input["priority"],
        RequestDeadline=deadline.date().isoformat(),
        UserID=user_id,
    )
    db.session.add(req)
    db.session.flush()
    req_id: int = req.RequestID

    log = ActivityLog(
        Action="create",
        EntityType="request",
        EntityID=req_id,
        fields={
            "userID": user_id,
            "RequestTitle": req.RequestTitle,
            "RequestState": req.RequestState,
            "RequestPriority": req.RequestPriority,
            "RequestDeadline": deadline.date().isoformat(),
        },
    )

    db.session.add(log)
    db.session.commit()
    return {"id": req_id}, 201

def _check_can_ask(req: Request, message: Any) -> Optional[ApiResponse]:
    """Check whether the signed-in TA may ask to work on a request.

    Returns an error response if the ask is not allowed, otherwise None.
    """
    if not isinstance(message, str) or len(message) > MESSAGE_MAX:
        return {"errorCode": "30", "error": "Message is too long"}, 400

    if req.RequestState in ("close", "reject"):
        return {"errorCode": "31", "error": "Request is no longer open"}, 400

    # One ask per TA per request (the table's key), so a declined TA can't ask again
    if db.session.get(RequestAssignment, (req.RequestID, current_user.UserID)) is not None:
        return {"errorCode": "32", "error": "Already asked"}, 400

    if _count_approved(req.RequestID) >= req.Capacity:
        return {"errorCode": "33", "error": "Request is full"}, 400

    return None


@request_api.post("/ask/<int:request_id>")
@jwt_required()
def ask_to_work(request_id: int) -> ApiResponse:
    """Save a TA's ask to work on a request, or return an error code.

    The call is invalid when the user is not a TA, the request ID
    can't be found, or the request can't take this ask (see _check_can_ask).
    """
    if current_user.UserRole != "lab_ta":
        return {"errorCode": "12", "error": "Unauthorized"}, 403

    req = db.session.get(Request, request_id)
    if req is None:
        return {"errorCode": "13", "error": "Not found"}, 404

    raw_input = request.get_json(silent=True)

    result = verify_user_input(raw_input, ASK_EXPECTED_KEYS)
    if result[1] != 200:
        return result
    message = cast(JsonDict, raw_input)["message"]

    error = _check_can_ask(req, message)
    if error is not None:
        return error

    db.session.add(RequestAssignment(
        RequestID=request_id,
        UserID=current_user.UserID,
        Message=message.strip() or None,
    ))
    db.session.add(ActivityLog(
        EntityType="request",
        EntityID=request_id,
        Action="update-ask-assignment",
        fields={
            "userID": current_user.UserID,
            "State": "Waiting",
        },
    ))
    db.session.commit()
    return {}, 201

@request_api.post("/edit/<int:request_id>")
@jwt_required()
def edit_request(request_id):

    user_input: ApiResponse = request.get_json(silent=True)
    result = verify_user_input(user_input, set())
    if result[1] != 200:
        return result
    print(user_input, flush=True)

    req: Request = db.session.execute(db.select(Request).where(Request.RequestID == request_id)).scalar()
    if req is None:
        return {"errorCode": "12", "error": "Not found"}, 404
    working_on: RequestAssignment = db.session.execute(db.select(RequestAssignment).where(
        (RequestAssignment.RequestID == request_id)
        & (RequestAssignment.UserID == current_user.UserID)
        & (RequestAssignment.State == "Approved")
    )).first()
    assigned_amount = _count_approved(request_id)

    if current_user.UserRole not in FILE_MANAGERS and working_on is None and current_user.UserID != req.UserID:
        return {"errorCode": "13", "error": "Unauthorized"}, 403

    updating = {
        "title": None,
        "details": None,
        "priority": None,
        "status": None,
        "capacity": None,
        "deadline": None,
    }

    updating["title"] = user_input.get("title")
    updating["details"] = user_input.get("details")

    # fields managers and lab tas can change
    if current_user.UserRole in FILE_MANAGERS or current_user.UserRole == "lab_ta":
        updating["status"] = user_input.get("status")
        if updating["status"]:
            if updating["status"] not in REQUEST_STATES:
                return {"errorCode": "22", "error": "Invalid status"}, 400
            allowed_status = [] # pending/in-progress is the same status, dependin on how many are assigned

    # checks for if lab tas can change status
    if current_user.UserRole in "lab_ta":
        if updating["status"]:
            if req.RequestState == "in-progress":
                allowed_status.append("review")

    # fields only managers can change
    if current_user.UserRole in FILE_MANAGERS:
        if updating["status"]:
            allowed_status.extend(["close", "reject"])
            if assigned_amount > 0:
                allowed_status.append("in-progress")
            else:
                allowed_status.append("pending")
        updating["priority"] = user_input.get("priority")
        if updating["priority"]:
            if updating["priority"] not in PRIORITIES:
                return {"errorCode": "21", "error": "Invalid priority"}, 400
        updating["capacity"] = user_input.get("capacity")
        if updating["capacity"]:
            try:
                updating["capacity"] = int(updating["capacity"])
            except ValueError:
                return {"errorCode": "24", "error": "Capacity must be an integer"}, 400
            if updating["capacity"] < 1 or updating["capacity"] < assigned_amount:
                return {"errorCode": "25", "error": "Invalid capacity"}
        updating["deadline"] = user_input.get("deadline")
        if updating["deadline"]:
            try:
                updating["deadline"] = datetime.strptime(updating["deadline"], "%Y-%m-%d")
            except ValueError, TypeError:
                return {"errorCode": "26", "error": "Invalid deadline date format"}, 400

    # DRY: Do Repeat Yourself
    # leaving the status as it is is always fine
    if updating["status"] and updating["status"] != req.RequestState:
        if updating["status"] not in allowed_status:
            return {"errorCode": "23", "error": "Unauthorized status change"}, 403
        req.RequestState = updating["status"]
    if updating["title"]: req.RequestTitle = updating["title"]
    if updating["details"]: req.RequestDetails = updating["details"]
    if updating["priority"]: req.RequestPriority = updating["priority"]
    if updating["capacity"]: req.Capacity = updating["capacity"]
    if updating["deadline"]:
        req.RequestDeadline = updating["deadline"]
        # doing this so its json serializable for Activity Log
        updating["deadline"] = updating["deadline"].isoformat()+"Z"

    db.session.add(ActivityLog(
        Action="update",
        EntityType="request",
        EntityID=request_id,
        fields={
            "updated": updating,
            "userID": current_user.UserID
        },
    ))

    db.session.commit()

    return updating, 200
