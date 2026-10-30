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
from VaseLabFlask.lib.authUtils import STAFF
from VaseLabFlask.lib.requestUtils import ASSIGNMENT_STATES, verify_user_input
from VaseLabFlask.models import ActivityLog, File, Request, RequestAssignment, User

# A JSON body, optionally paired with an HTTP status code
JsonDict = dict[str, Any]
ApiResponse = Union[JsonDict, tuple[JsonDict, int]]

TITLE_MAX = 255
DETAILS_MAX = 2000
MESSAGE_MAX = 1000
PRIORITIES = {"low", "medium", "high"}
CREATE_EXPECTED_KEYS = ["title", "details", "priority", "deadline"]
CAPACITY_EXPECTED_KEYS = ["capacity"]
ASK_EXPECTED_KEYS = ["message"]

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

    if current_user.UserRole not in STAFF and req.UserID != current_user.UserID:
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
        UserID=user_id,
        Action="create",
        EntityType="request",
        EntityID=req_id,
        NewValue={
            "RequestTitle": req.RequestTitle,
            "RequestState": req.RequestState,
            "RequestPriority": req.RequestPriority,
            "RequestDeadline": deadline.date().isoformat(),
        },
    )

    db.session.add(log)
    db.session.commit()
    return {"id": req_id}, 201


@request_api.post("/capacity/<int:request_id>")
@jwt_required()
def set_request_capacity(request_id: int) -> ApiResponse:
    """Set how many TAs can be approved for a request, or return an error code.

    The call is invalid when the user is not a lab manager, the request
    can't be found, or the capacity is below the number of approved TAs.
    """
    if current_user.UserRole != "lab_manager":
        return {"errorCode": "12", "error": "Unauthorized"}, 403

    # Locked so an approval can't land between the count below and the save
    req: Optional[Request] = db.session.execute(
        db.select(Request).where(Request.RequestID == request_id).with_for_update()
    ).scalar()
    if req is None:
        return {"errorCode": "13", "error": "Not found"}, 404

    raw_input = request.get_json(silent=True)

    result = verify_user_input(raw_input, CAPACITY_EXPECTED_KEYS)
    if result[1] != 200:
        return result
    user_input = cast(JsonDict, raw_input)

    capacity = user_input["capacity"]
    # bool is a subclass of int, so exclude it to keep the original behaviour
    if not isinstance(capacity, int) or isinstance(capacity, bool) or capacity < 1:
        return {"errorCode": "30", "error": "Capacity must be a whole number of at least 1"}, 400

    if capacity < _count_approved(request_id):
        return {"errorCode": "31", "error": "Capacity is below the number of approved TAs"}, 400

    if capacity != req.Capacity:
        db.session.add(ActivityLog(
            UserID=current_user.UserID,
            Action="update",
            EntityType="request",
            EntityID=request_id,
            OldValue={"Capacity": req.Capacity},
            NewValue={"Capacity": capacity},
        ))
        req.Capacity = capacity
    db.session.commit()
    return {"capacity": capacity}


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
        UserID=current_user.UserID,
        Action="update",
        EntityType="request",
        EntityID=request_id,
        NewValue={"Assignment": {"UserID": current_user.UserID, "State": "Waiting"}},
    ))
    db.session.commit()
    return {}, 201