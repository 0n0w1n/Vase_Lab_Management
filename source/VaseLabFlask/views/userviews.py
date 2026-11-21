from flask import Blueprint, request
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from flask_jwt_extended import jwt_required, current_user
from datetime import date, datetime
from VaseLabFlask.extensions import db
from VaseLabFlask.models import User
from VaseLabFlask.lib.requestUtils import verify_user_input
from VaseLabFlask.lib.authUtils import hash_password, verify_password

user_api = Blueprint("user_api", __name__)

current_user: User


def validation_error(message, field=None):
    return {"error": message, "field": field}, 400


@user_api.post("/update/<int:user_id>")
@jwt_required()
def update_user(user_id: int):
    EXPECTED_KEYS = set()
    NAME_MAX = 255
    ORG_MAX = 150
    PASSWORD_MIN = 12
    PASSWORD_MAX = 128

    user_input = request.get_json(silent=True)
    result = verify_user_input(user_input, EXPECTED_KEYS)
    if result[1] != 200:
        return result
    user_input: dict

    user: User = db.session.execute(db.select(User).where(User.UserID == user_id)).scalar()
    if user is None:
        return {"errorCode": "12", "error": "Not found"}, 404

    if user_id != current_user.UserID and current_user.UserRole != "admin":
        return {"errorCode": "13", "error": "unauthorized"}, 403

    if "name" in user_input.keys():
        if len(user_input["name"]) <= 0:
            return {"errorCode": "30", "error": "Name is too short"}, 400
        if len(user_input["name"]) > NAME_MAX:
            return {"errorCode": "31", "error": "Name is too long"}, 400
        name = user_input["name"]
    else:
        name = user.UserFullName

    if "organization" in user_input.keys():
        if len(user_input["organization"]) > ORG_MAX:
            return {"errorCode": "32", "error": "Organization is too long"}, 400
        org = user_input["organization"]
    else: org = user.UserOrganization

    if "newPassword" in user_input.keys():
        if "currentPassword" not in user_input.keys():
            return {"errorCode": "33", "error": "currentPassword is required to change password"}, 400
        current_password_hash = user.PasswordHash
        current_password = user_input["currentPassword"]
        new_password = user_input["newPassword"]
        if not verify_password(current_password_hash, current_password):
            return {"errorCode": "34", "error": "Invalid current password"}, 400
        if len(new_password) < PASSWORD_MIN:
            return {"errorCode": "35", "error": "New password too short"}, 400
        if len(new_password) > PASSWORD_MAX:
            return {"errorCode": "36", "error": "New password too long"}, 400
        if current_password == new_password:
            return {"errorCode": "37", "error": "New password should be different from the current password"}, 400

        new_password_hash = hash_password(new_password)
    else: new_password_hash = user.PasswordHash

    user.UserFullName = name
    user.UserOrganization = org
    user.PasswordHash = new_password_hash
    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return {{"errorCode": "40", "error": "Unknown error occured"}, 500}
    return get_user(user_id)

@user_api.get("/current")
@jwt_required()
def get_current():
    return get_user(current_user.UserID)

@user_api.get("/<int:user_id>")
@jwt_required()
def get_user(user_id: int):
    is_owner = False
    if user_id == current_user.UserID: # Hugo : Added the detection of the current session
        is_owner = True

    user: User = db.session.execute(db.select(User).where(User.UserID == user_id)).scalar()
    if user is None:
        return {"errorCode": "10", "error": "Not found"}, 404

    return {
        "id": str(user.UserID),
        "name": user.UserFullName,
        "email": user.Email,
        "role": user.UserRole,
        "organization": user.UserOrganization,
        "createdAt": user.CreatedAt.isoformat()+"Z" if user.CreatedAt else None,
        "isOwner": is_owner
    }
