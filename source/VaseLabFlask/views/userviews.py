import re
from flask import Blueprint, request
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from views.authviews import hash_password, verify_password
from extensions import db
from flask_jwt_extended import jwt_required, current_user
from models import *
from datetime import date, datetime

user_api = Blueprint("user_api", __name__)

current_user: User


def validation_error(message, field=None):
    return {"error": message, "field": field}, 400


@user_api.patch("/current")
@jwt_required()
def update_current():
    data = request.get_json(silent=True)
    allowed = {"name", "email", "organization"}
    if not isinstance(data, dict) or not data or set(data) - allowed:
        return validation_error("Provide only name, email, or organization.")

    values = {}
    for field, limit in (("name", 255), ("email", 254), ("organization", 150)):
        if field not in data:
            continue
        value = data[field]
        if field == "organization" and value is None:
            values[field] = None
            continue
        if not isinstance(value, str):
            return validation_error("Must be text.", field)
        value = value.strip()
        if (field != "organization" and not value) or len(value) > limit:
            return validation_error(f"Enter {'1' if field != 'organization' else '0'} to {limit} characters.", field)
        if field == "email" and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            return validation_error("Enter a valid email address.", field)
        values[field] = value or None

    if "email" in values:
        duplicate = db.session.execute(db.select(User).where(
            User.Email == values["email"], User.UserID != current_user.UserID
        )).scalar_one_or_none()
        if duplicate:
            return {"error": "This email is already in use.", "field": "email"}, 409

    for field, column in (("name", "UserFullName"), ("email", "Email"), ("organization", "UserOrganization")):
        if field in values:
            setattr(current_user, column, values[field])
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return {"error": "This email is already in use.", "field": "email"}, 409
    except SQLAlchemyError:
        db.session.rollback()
        return {"error": "Could not save your profile."}, 500
    return get_current()


@user_api.patch("/current/password")
@jwt_required()
def update_password():
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or set(data) != {"currentPassword", "newPassword"}:
        return validation_error("Provide currentPassword and newPassword.")
    old_password, new_password = data["currentPassword"], data["newPassword"]
    if not isinstance(old_password, str) or not 1 <= len(old_password) <= 1024:
        return validation_error("Enter your current password.", "currentPassword")
    if not isinstance(new_password, str) or not 12 <= len(new_password) <= 128:
        return validation_error("Use 12 to 128 characters.", "newPassword")
    if not verify_password(current_user.PasswordHash, old_password):
        return validation_error("Current password is incorrect.", "currentPassword")
    if old_password == new_password:
        return validation_error("Choose a different password.", "newPassword")
    current_user.PasswordHash = hash_password(new_password)
    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return {"error": "Could not change your password."}, 500
    return {"message": "Password updated."}

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
