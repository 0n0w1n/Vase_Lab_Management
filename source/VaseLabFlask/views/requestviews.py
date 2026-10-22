from flask import Blueprint, request
from extensions import db
from flask_jwt_extended import jwt_required, current_user
from models import *
from datetime import date, datetime
from lib.requestUtils import verify_user_input

request_api = Blueprint("request_api", __name__)

current_user: User
STAFF = {"admin", "lab_manager", "lab_ta"}

def verify_request(request_id: int, user: User):
    query = (
        db.select(Request.RequestID)
        .where(Request.RequestID == request_id)
    )
    if user.UserRole not in STAFF:
        query = query.where(Request.UserID == user.UserID)
    data = db.session.execute(query).first()

    # both request not found and unauthorized returns 404
    if data is None:
        return {"errorCode": "10", "error": "Not found"}, 404

    return {"errorCode": "0", "error": "None"}, 200

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
            "requesterID": requester.UserID
        })

    return result

@request_api.get("/details/<int:request_id>")
@jwt_required()
def get_request_details(request_id: int):

    result = verify_request(request_id, current_user)
    if result[1] != 200:
        return result

    req, user = db.session.execute(
        db.select(Request, User)
        .join(User, Request.UserID == User.UserID)
        .where(Request.RequestID == request_id)
    ).first()
    req: Request
    user: User

    files = db.session.execute(
        db.select(File).where(File.RequestID == request_id).order_by(File.CreatedAt)
    ).all()

    submissionTime = db.session.execute(
        db.select(ActivityLog.CreatedAt)
            .where(
                (ActivityLog.EntityType == "request")
                & (ActivityLog.EntityID == request_id)
                & (ActivityLog.Action == "create")
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
        "requestedID": user.UserID,
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
        RequestDeadline=deadline.date().isoformat()+"Z",
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
            "RequestDeadline": deadline.date().isoformat()+"Z",
        }
    )

    db.session.add(log)
    db.session.commit()
    return {"id": reqID}, 201

@request_api.get("/comments/<int:request_id>")
@jwt_required()
def get_request_comments(request_id: int):

    result = verify_request(request_id, current_user)
    if result[1] != 200:
        return result

    query = (
        db.select(Comment, User)
        .join(User, Comment.UserID == User.UserID)
        .where(Comment.RequestID == request_id)
        .order_by(Comment.CreatedAt, Comment.CommentID)
    )
    comments = db.session.execute(query).all()

    result = []
    for comment, author in comments:
        comment: Comment
        author: User
        result.append({
            "id": str(comment.CommentID),
            "author": author.UserFullName,
            "authorID": author.UserID,
            "at": comment.CreatedAt.isoformat()+"Z" if comment.CreatedAt else None,
            "body": comment.CommentText,
        })

    return result

@request_api.post("/comments/<int:request_id>")
@jwt_required()
def create_request_comments(request_id: int):

    result = verify_request(request_id, current_user)
    if result[1] != 200:
        return result

    MESSAGE_MAX = 2000
    userID = current_user.UserID
    EXPECTED_KEYS = ["text"]

    user_input = request.get_json(silent=True)

    result = verify_user_input(user_input, EXPECTED_KEYS)
    if result[1] != 200:
        return result

    body = user_input["text"]
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
        "author": current_user.UserFullName,
        "authorID": current_user.UserID,
        "at": comment.CreatedAt.isoformat()+"Z" if comment.CreatedAt else None,
        "body": comment.CommentText,
    }, 201

# Given the current headache its been, we may have to rework activity log
'''
@request_api.get("/<int:request_id>/activity")
@jwt_required()
def get_request_activity(request_id: int):

    result = verify_request(request_id, current_user)
    if result[1] != 200:
        return result

    # Comment logs point at the comment, so they are matched through the request's comments
    comments = db.select(Comment.CommentID, Comment.CommentText).where(Comment.RequestID == request_id)
    comments = dict(zip(comments))

    query = (
        db.select(ActivityLog, User)
        .join(User, ActivityLog.UserID == User.UserID)
        .where(
            ((ActivityLog.EntityType == "request") & (ActivityLog.EntityID == request_id))
            | ((ActivityLog.EntityType == "comment") & (ActivityLog.EntityID.in_(comments.keys())),
        ))
        .order_by(ActivityLog.CreatedAt, ActivityLog.LogID)
    )
    logs = db.session.execute(query).all()

    result = []
    for log, actor in logs:
        log: ActivityLog
        actor: User
        record = {
                "id": str(log.LogID),
                "type": log.EntityType,
                "action": log.Action,
                "actor": actor.UserFullName,
                "actorID": actor.UserID,
                "time": log.CreatedAt.isoformat()+"Z" if log.CreatedAt else None,
            }
        if log.EntityType == "comment" and log.Action == "create":
            record["message"] = comments[log.EntityID]
        elif log.EntityType == "request" and log.Action == "update":
            record["message"] = log.NewValue
        elif log.EntityType == "request" and log.Action == "create":
            record["message"] = None
        else:
            record["message"] = None
        result.append(record)

    return result
'''