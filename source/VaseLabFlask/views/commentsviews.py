"""Read and post comments on a request's message log."""

from flask import Blueprint, request
from flask_jwt_extended import current_user, jwt_required

from VaseLabFlask.extensions import db
from VaseLabFlask.lib.authUtils import can_read_request
from VaseLabFlask.lib.requestUtils import iso, verify_user_input
from VaseLabFlask.models import ActivityLog, Comment, Request, User

comments_api = Blueprint("comments_api", __name__)
COMMENT_MAX = 1000


def _check_request_access(request_id: int):
    req = db.session.get(Request, request_id)
    if req is None:
        return {"errorCode": "12", "error": "Request not found"}, 404
    if not can_read_request(current_user, req):
        return {"errorCode": "13", "error": "Unauthorized"}, 403
    return None


@comments_api.post("/<int:request_id>/comments")
@jwt_required()
def add_comment(request_id: int):
    error = _check_request_access(request_id)
    if error is not None:
        return error

    EXPECTED_KEYS = ["Comment"]
    user_input = request.get_json(silent=True)
    result = verify_user_input(user_input, EXPECTED_KEYS)
    if result[1] != 200:
        return result

    text = user_input["Comment"]
    if not isinstance(text, str):
        return {
            "errorCode": "30",
            "error": "Comment must be a string"
        }, 400

    text = text.strip()
    if not text:
        return {"errorCode": "30", "error": "Comment text is required"}, 400
    if len(text) > COMMENT_MAX:
        return {"errorCode": "31", "error": "Comment is too long"}, 400

    comment = Comment(RequestID=request_id, UserID=current_user.UserID, CommentText=text)
    db.session.add(comment)
    db.session.flush()
    comment_id = comment.CommentID
    db.session.add(ActivityLog(
        # UserID=current_user.UserID,
        Action="create",
        EntityType="comment",
        EntityID=comment_id,
        fields={"userID": current_user.UserID, "RequestID": request_id},
    ))
    db.session.commit()
    return {"id": str(comment_id)}, 201


@comments_api.get("/<int:request_id>/comments")
@jwt_required()
def get_comments(request_id: int):
    error = _check_request_access(request_id)
    if error is not None:
        return error

    rows = db.session.execute(
        db.select(Comment, User.UserFullName)
        .join(User, Comment.UserID == User.UserID)
        .where(Comment.RequestID == request_id)
        .order_by(Comment.CreatedAt, Comment.CommentID)
    )
    return [
        {
            "id": str(comment.CommentID),
            "author": {
                "name": name,
                "initials": "".join(part[0].upper() for part in name.split())[:2],
            },
            "at": iso(comment.CreatedAt),
            "body": comment.CommentText,
        }
        for comment, name in rows
    ]
