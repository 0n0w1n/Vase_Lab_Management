from flask import Blueprint, request
from sqlalchemy import func
from extensions import db
from flask_jwt_extended import jwt_required, current_user
from models import *
from datetime import date, datetime
from lib.requestUtils import verify_user_input
from views.dashboardviews import ASSIGNMENT_STATES

request_api = Blueprint("request_api", __name__)

current_user: User
STAFF = {"admin", "lab_manager", "lab_ta"}

@request_api.get("/list")
@jwt_required()
def get_requests_list():

    query = \
        db.select(Request, User) \
        .join(User, Request.UserID == User.UserID) \
        .order_by(Request.RequestID.desc())

    if current_user.UserRole not in STAFF:
        query = query.where(Request.UserID == current_user.UserID)

    requests: tuple[list[Request], list[User]] = db.session.execute(query).all()

    result = []
    for req, requester in requests:
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
def get_request_details(request_id: int):
    data: tuple[Request, User] = db.session.execute(db.select(Request, User).join(User, Request.UserID == User.UserID).where(Request.RequestID == request_id)).first()
    if data is None:
        return {"errorCode": "10", "error": "Not found"}, 404

    req = data[0]
    user = data[1]

    if current_user.UserRole not in STAFF and req.UserID != current_user.UserID:
        return {"errorCode": "11", "error": "Unauthorized"}, 403

    files = db.session.execute(
        db.select(File).where(File.RequestID == request_id).order_by(File.CreatedAt)
    ).all()

    assignments: list[tuple[RequestAssignment, User]] = db.session.execute(
        db.select(RequestAssignment, User)
        .join(User, RequestAssignment.UserID == User.UserID)
        .where(RequestAssignment.RequestID == request_id)
        .order_by(RequestAssignment.DecidedAt)
    ).all()
    assignees = [ta.UserFullName for assignment, ta in assignments if assignment.State == "Approved"]
    # The signed-in TA's own ask, so the page can show Work on / Waiting / Approved / Declined
    my_state = next((assignment.State for assignment, _ in assignments if assignment.UserID == current_user.UserID), None)

    result = {
        "id": str(req.RequestID),
        "title": req.RequestTitle,
        "details": req.RequestDetails,
        "status": req.RequestState,
        "priority": req.RequestPriority,
        "deadline": req.RequestDeadline.date().isoformat(),
        "requestedBy": user.UserFullName,
        "submittedAt": req.CreatedAt.isoformat()+"Z" if req.CreatedAt else None,
        "capacity": req.Capacity,
        "assignedCount": len(assignees),
        "assignees": assignees,
        "myAsk": ASSIGNMENT_STATES.get(my_state),
        "files": []
    }
    for file in files:
        createdAt = file.CreatedAt.isoformat()+"Z" if file.CreatedAt else None
        result["files"].append({
            "id": file.FileID,
            "name": file.FileName,
            "bytes": file.FileSize or "Unknown",
            "uploadedAt": createdAt
        })

    return result

@request_api.post("/create")
@jwt_required()
def create_request():

    TITLE_MAX = 255
    DETAILS_MAX = 2000
    PRIORITIES = {"low", "medium", "high"}
    EXPECTED_KEYS = ["title", "details", "priority", "deadline"]
    userID = current_user.UserID

    user_input = request.get_json(silent=True)

    result = verify_user_input(user_input, EXPECTED_KEYS)
    if result[1] != 200:
        return result

    title = user_input["title"]
    if len(title) > TITLE_MAX:
        return {"errorCode": "30", "error": "Title is too long"}, 400

    details = user_input["details"]
    if len(details) > DETAILS_MAX:
        return {"errorCode": "31", "error": "Details are too long"}, 400

    priority = user_input["priority"]
    if priority not in PRIORITIES:
        return {"errorCode": "32", "error": "Invalid priority"}, 400

    deadline = user_input["deadline"]
    try:
        deadline = datetime.strptime(deadline, "%Y-%m-%d")
    except ValueError:
        return {"errorCode": "33", "error": "Invalid date format"}, 400
    if deadline.date() < date.today():
        return {"errorCode": "34", "error": "Invalid date"}, 400

    req = Request(
        RequestTitle=title,
        RequestDetails=details,
        RequestPriority=priority,
        RequestDeadline=deadline.date().isoformat(),
        UserID=userID
    )
    db.session.add(req)
    db.session.flush()
    reqID = req.RequestID

    log = ActivityLog(
        UserID=userID,
        Action="create",
        EntityType="request",
        EntityID=req.RequestID,
        NewValue={
            "RequestTitle": req.RequestTitle,
            "RequestState": req.RequestState,
            "RequestPriority": req.RequestPriority,
            "RequestDeadline": deadline.date().isoformat(),
        }
    )

    db.session.add(log)
    db.session.commit()
    return {"id": reqID}, 201

@request_api.post("/capacity/<int:request_id>")
@jwt_required()
def set_request_capacity(request_id: int):

    EXPECTED_KEYS = ["capacity"]

    if current_user.UserRole != "lab_manager":
        return {"errorCode": "12", "error": "Unauthorized"}, 403

    # Locked so an approval can't land between the count below and the save
    req = db.session.execute(
        db.select(Request).where(Request.RequestID == request_id).with_for_update()
    ).scalar()
    if req is None:
        return {"errorCode": "13", "error": "Not found"}, 404

    user_input = request.get_json(silent=True)

    result = verify_user_input(user_input, EXPECTED_KEYS)
    if result[1] != 200:
        return result

    capacity = user_input["capacity"]
    if type(capacity) != int or capacity < 1:
        return {"errorCode": "30", "error": "Capacity must be a whole number of at least 1"}, 400

    approved = db.session.scalar(
        db.select(func.count())
        .select_from(RequestAssignment)
        .where(RequestAssignment.RequestID == request_id, RequestAssignment.State == "Approved")
    )
    if capacity < approved:
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

@request_api.post("/ask/<int:request_id>")
@jwt_required()
def ask_to_work(request_id: int):

    MESSAGE_MAX = 1000
    EXPECTED_KEYS = ["message"]

    if current_user.UserRole != "lab_ta":
        return {"errorCode": "12", "error": "Unauthorized"}, 403

    req = db.session.get(Request, request_id)
    if req is None:
        return {"errorCode": "13", "error": "Not found"}, 404

    user_input = request.get_json(silent=True)

    result = verify_user_input(user_input, EXPECTED_KEYS)
    if result[1] != 200:
        return result

    message = user_input["message"]
    if type(message) != str or len(message) > MESSAGE_MAX:
        return {"errorCode": "30", "error": "Message is too long"}, 400

    if req.RequestState in ("close", "reject"):
        return {"errorCode": "31", "error": "Request is no longer open"}, 400

    # One ask per TA per request (the table's key), so a declined TA can't ask again
    if db.session.get(RequestAssignment, (request_id, current_user.UserID)) is not None:
        return {"errorCode": "32", "error": "Already asked"}, 400

    approved = db.session.scalar(
        db.select(func.count())
        .select_from(RequestAssignment)
        .where(RequestAssignment.RequestID == request_id, RequestAssignment.State == "Approved")
    )
    if approved >= req.Capacity:
        return {"errorCode": "33", "error": "Request is full"}, 400

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