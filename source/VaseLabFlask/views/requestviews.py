from flask import Blueprint, request
from sqlalchemy import and_, or_
from extensions import db
from flask_jwt_extended import jwt_required, current_user
from models import *
from datetime import date, datetime
from lib.requestUtils import verify_user_input

request_api = Blueprint("request_api", __name__)

current_user: User
STAFF = {"admin", "lab_manager", "lab_ta"}

def get_accessible_request(request_id: int):
    query = (
        db.select(Request, User)
        .join(User, Request.UserID == User.UserID)
        .where(Request.RequestID == request_id)
    )
    data: tuple[Request, User] = db.session.execute(query).first()

    if data is None:
        return None, ({"errorCode": "10", "error": "Not found"}, 404)

    req = data[0]
    if current_user.UserRole not in STAFF and req.UserID != current_user.UserID:
        return None, ({"errorCode": "11", "error": "Unauthorized"}, 403)

    return data, None

def person(user: User):
    parts = user.UserFullName.split()[:2]
    return {
        "name": user.UserFullName,
        "initials": "".join(part[0] for part in parts).upper(),
    }

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

@request_api.get("/details/<int:request_id>")
@jwt_required()
def get_request_details(request_id: int):

    data, error = get_accessible_request(request_id)
    if error:
        return error
    req, user = data

    files = db.session.execute(
        db.select(File).where(File.RequestID == request_id).order_by(File.CreatedAt)
    ).all()

    submissionTime = db.session.execute(
        db.select(ActivityLog.CreatedAt)\
        .where(
            ActivityLog.EntityType == "request",
            ActivityLog.EntityID == request_id,
            ActivityLog.Action == "create",
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
        "submittedAt": submissionTime.isoformat()+"Z" if submissionTime else None,
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

@request_api.get("/messages/<int:request_id>")
@jwt_required()
def get_request_messages(request_id: int):

    _, error = get_accessible_request(request_id)
    if error:
        return error

    query = (
        db.select(Comment, User)
        .join(User, Comment.UserID == User.UserID)
        .where(Comment.RequestID == request_id)
        .order_by(Comment.CreatedAt, Comment.CommentID)
    )
    comments = db.session.execute(query).all()

    result = []
    for comment, author in comments:
        result.append({
            "id": str(comment.CommentID),
            "author": person(author),
            "at": comment.CreatedAt.isoformat()+"Z" if comment.CreatedAt else None,
            "body": comment.CommentText,
        })

    return result

@request_api.post("/messages/<int:request_id>")
@jwt_required()
def create_request_messages(request_id: int):

    _, error = get_accessible_request(request_id)
    if error:
        return error

    MESSAGE_MAX = 2000
    userID = current_user.UserID
    EXPECTED_KEYS = ["body"]

    user_input = request.get_json(silent=True)

    result = verify_user_input(user_input, EXPECTED_KEYS)
    if result[1] != 200:
        return result

    body = user_input["body"]
    if type(body) != str or not body.strip():
        return {"errorCode": "30", "error": "Message is empty"}, 400
    body = body.strip()
    if len(body) > MESSAGE_MAX:
        return {"errorCode": "31", "error": "Message is too long"}, 400

    comment = Comment(
        CommentText=body,
        UserID=userID,
        RequestID=request_id
    )
    db.session.add(comment)
    db.session.flush()

    log = ActivityLog(
        UserID=userID,
        Action="create",
        EntityType="comment",
        EntityID=comment.CommentID
    )

    db.session.add(log)
    db.session.commit()
    return {
        "id": str(comment.CommentID),
        "author": person(current_user),
        "at": comment.CreatedAt.isoformat()+"Z" if comment.CreatedAt else None,
        "body": comment.CommentText,
    }, 201

# (Action, EntityType) -> what the activity history says the user did
ACTIVITY_MESSAGES = {
    ("create", "request"): "created the request",
    ("create", "comment"): "posted a message",
}

@request_api.get("/activity/<int:request_id>")
@jwt_required()
def get_request_activity(request_id: int):

    _, error = get_accessible_request(request_id)
    if error:
        return error

    # Comment logs point at the comment, so they are matched through the request's comments
    comment_ids = db.select(Comment.CommentID).where(Comment.RequestID == request_id)

    query = (
        db.select(ActivityLog, User)
        .join(User, ActivityLog.UserID == User.UserID)
        .where(or_(
            and_(ActivityLog.EntityType == "request", ActivityLog.EntityID == request_id),
            and_(ActivityLog.EntityType == "comment", ActivityLog.EntityID.in_(comment_ids)),
        ))
        .order_by(ActivityLog.CreatedAt, ActivityLog.LogID)
    )
    logs = db.session.execute(query).all()

    result = []
    for log, actor in logs:
        message = ACTIVITY_MESSAGES.get(
            (log.Action, log.EntityType), f"{log.Action}d the {log.EntityType}"
        )
        result.append({
            "id": str(log.LogID),
            "actor": person(actor),
            "at": log.CreatedAt.isoformat()+"Z" if log.CreatedAt else None,
            "message": message,
        })

    return result
