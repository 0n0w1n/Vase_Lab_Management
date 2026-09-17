from flask import Blueprint, request
from extensions import db
from flask_jwt_extended import jwt_required, current_user
from models import *
from datetime import date, datetime

request_api = Blueprint("request_api", __name__)

@request_api.get("/list")
def get_requests_list():
    requests: tuple[list[Request], list[User]] = db.session.execute(
        db.select(Request, User) \
            .join(User, Request.UserID == User.UserID) \
            .order_by(Request.RequestID.desc())
    ).all()

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
def get_request_details(request_id: int):
    data: tuple[Request, User] = db.session.execute(db.select(Request, User).join(User, Request.UserID == User.UserID).where(Request.RequestID == request_id)).first()
    if data is None:
        return {"errorCode": "10", "error": "Not found"}, 404

    req = data[0]
    user = data[1]

    files = db.session.execute(
        db.select(File).where(File.RequestID == request_id).order_by(File.CreatedAt)
    ).all()

    submissionTime = db.session.execute(
        db.select(ActivityLog.CreatedAt)\
        .where(
            ActivityLog.EntityType == "request"\
            and request_id == ActivityLog.EntityID\
            and ActivityLog.Action == "create"
        )
    ).scalar()
    submissionTime: datetime

    result = {
        "id": str(req.RequestID),
        "title": req.RequestTitle,
        "details": req.RequestDetails,
        "status": req.RequestState,
        "priority": req.RequestPriority,
        "deadline": req.RequestDeadline.date().isoformat(),
        "requestedBy": user.UserFullName,
        "submittedAt": submissionTime.isoformat()+"Z" if not None else None,
        "files": []
    }
    for file in files:
        createdAt = file.CreatedAt.isoformat()+"Z" if not None else None
        result["files"].append({
            "id": file.FileID,
            "name": file.FileName,
            "bytes": file.FileSize or "Unknown",
            "uploadedAt": createdAt
        })

    return result

@request_api.post("/create")
# @jwt_required()
def create_request():

    TITLE_MAX = 255
    DETAILS_MAX = 2000
    PRIORITIES = {"low", "medium", "high"}
    EXPECTED_KEYS = ["title", "details", "priority", "deadline"]
    userID = 1 # Placeholder

    user_input = request.get_json(silent=True)
    if user_input is None:
        return {"errorCode": "10", "error": "JSON unparseable"}, 400
    if type(user_input) != dict:
        return {"errorCode": "11", "error": "Not valid JSON"}, 400
    user_input: dict

    input_keys = user_input.keys()
    for i, expected_key in enumerate(EXPECTED_KEYS):
        if expected_key not in input_keys:
            return {"errorCode": f"2{i}", "error": f"Key '{expected_key}' not found"}, 400

    title = user_input.get("title")
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
        return {"errorcode": "34", "error": "Invalid date"}, 400

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