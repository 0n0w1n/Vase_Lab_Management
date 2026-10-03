import re
from flask import Blueprint, request
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from extensions import db
from flask_jwt_extended import jwt_required, current_user
from models import *
from datetime import date, datetime
from lib.requestUtils import verify_user_input
from lib.authUtils import hash_password, verify_password

user_api = Blueprint("user_api", __name__)

current_user: User


def validation_error(message, field=None):
    return {"error": message, "field": field}, 400


@user_api.post("/update/profile")
@jwt_required()
def update_current():
    EXPECTED_KEYS = set()
    NAME_MAX = 255
    ORG_MAX = 150

    user_input = request.get_json(silent=True)
    result = verify_user_input(user_input, EXPECTED_KEYS)
    if result[1] != 200:
        return result
    user_input: dict

    if "name" in user_input.keys():
        if len(user_input["name"]) <= 0:
            return {"errorCode": "30", "error": "Name is too short"}, 400
        if len(user_input["name"]) > NAME_MAX:
            return {"errorCode": "31", "error": "Name is too long"}, 400
        name = user_input["name"]
    else: name = current_user.UserFullName

    if "organization" in user_input.keys():
        if len(user_input["organization"]) > ORG_MAX:
            return {"errorCode": "32", "error": "Organization is too long"}, 400
        org = user_input["organization"]
    else: org = current_user.UserOrganization

    current_user.UserFullName = name
    current_user.UserOrganization = org
    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return {{"errorCode": "40", "error": "Unknown error occured"}, 500}
    return get_current()


@user_api.post("/update/password")
@jwt_required()
def update_password():
    EXPECTED_KEYS = {"currentPassword", "newPassword"}
    NEW_MIN = 12
    NEW_MAX = 128
    user_input = request.get_json(silent=True)
    result = verify_user_input(user_input, EXPECTED_KEYS)
    if result[1] != 200:
        return result

    current_password, new_password = user_input["currentPassword"], user_input["newPassword"]
    current_password_hash = current_user.PasswordHash

    if not verify_password(current_password_hash, current_password):
        return {"errorCode": "30", "error": "Invalid current password"}, 400
    if len(new_password) < NEW_MIN:
        return {"errorCode": "31", "error": "New password too short"}, 400
    if len(new_password) > NEW_MAX:
        return {"errorCode": "32", "error": "New password too long"}, 400
    if current_password == new_password:
        return {"errorCode": "33", "error": "New password should be different from the current password"}, 400

    current_user.PasswordHash = hash_password(new_password)
    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return {"errorCode": "40", "error": "Unknown error occured"}, 500
    return {"message": "Password updated"}, 200

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
