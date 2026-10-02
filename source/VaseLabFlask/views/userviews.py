from flask import Blueprint
from extensions import db
from flask_jwt_extended import jwt_required, current_user
from models import *
from datetime import date, datetime

user_api = Blueprint("user_api", __name__)

current_user: User

@user_api.get("/current")
@jwt_required()
def get_current():
    return get_user(current_user.UserID)

@user_api.get("/<int:user_id>")
@jwt_required()
def get_user(user_id: int):
    if user_id != current_user.UserID: # Hugo : Added the detection of the current session
        return {"errorCode": "10", "error": "Not found"}, 404

    user: User = db.session.execute(db.select(User).where(User.UserID == user_id)).scalar()
    if user is None:
        return {"errorCode": "10", "error": "Not found"}, 404

    return {
        "id": str(user.UserID),
        "name": user.UserFullName,
        "email": user.Email,
        "role": user.UserRole,
        "organization": user.UserOrganization,
        "createdAt": user.CreatedAt.isoformat()+"Z" if user.CreatedAt else None
    }