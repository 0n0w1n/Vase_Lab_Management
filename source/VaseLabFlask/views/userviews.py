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
    EMAIL_MAX = 254
    ROLES = {"admin", "lab_manager", "lab_ta", "lab_member", "visitor"}

    user_input = request.get_json(silent=True)
    result = verify_user_input(user_input, EXPECTED_KEYS)
    if result[1] != 200:
        return result
    user_input: dict

    user: User = db.session.execute(db.select(User).where(User.UserID == user_id)).scalar()
    if user is None:
        return {"errorCode": "12", "error": "Not found"}, 404

    # Admins may edit anyone (other admins and themselves included) and every field.
    # Everyone else may only edit their own name, organization and password.
    is_admin = current_user.UserRole == "admin"
    if user_id != current_user.UserID and not is_admin:
        return {"errorCode": "13", "error": "unauthorized"}, 403
    if not is_admin and ("email" in user_input or "role" in user_input):
        return {"errorCode": "14", "error": "Only admins can change email or role"}, 403

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
        new_password = user_input["newPassword"]
        # Admins reset passwords without knowing the old one
        current_password = user_input.get("currentPassword")
        if not is_admin:
            if current_password is None:
                return {"errorCode": "33", "error": "currentPassword is required to change password"}, 400
            if not verify_password(user.PasswordHash, current_password):
                return {"errorCode": "34", "error": "Invalid current password"}, 400
        if not isinstance(new_password, str) or len(new_password) < PASSWORD_MIN:
            return {"errorCode": "35", "error": "New password too short"}, 400
        if len(new_password) > PASSWORD_MAX:
            return {"errorCode": "36", "error": "New password too long"}, 400
        if current_password == new_password:
            return {"errorCode": "37", "error": "New password should be different from the current password"}, 400

        new_password_hash = hash_password(new_password)
    else: new_password_hash = user.PasswordHash

    if "email" in user_input.keys():
        email = user_input["email"]
        if (
            not isinstance(email, str)
            or not 3 <= len(email) <= EMAIL_MAX
            or email.count("@") != 1
            or email.startswith("@")
            or email.endswith("@")
            or any(character.isspace() for character in email)
        ):
            return {"errorCode": "38", "error": "Invalid email"}, 400
        taken = db.session.execute(
            db.select(User).where(User.Email == email, User.UserID != user.UserID)
        ).scalar()
        if taken is not None:
            return {"errorCode": "50", "error": "Email already registered"}, 409
    else: email = user.Email

    if "role" in user_input.keys():
        role = user_input["role"]
        if role not in ROLES:
            return {"errorCode": "39", "error": "Invalid role"}, 400
    else: role = user.UserRole

    user.UserFullName = name
    user.UserOrganization = org
    user.PasswordHash = new_password_hash
    user.Email = email
    user.UserRole = role
    try:
        db.session.commit()
    except IntegrityError:
        # Two saves could pass the email check at the same time
        db.session.rollback()
        return {"errorCode": "50", "error": "Email already registered"}, 409
    except SQLAlchemyError:
        db.session.rollback()
        return {"errorCode": "40", "error": "Unknown error occured"}, 500
    return get_user(user_id)


@user_api.get("/list")
@jwt_required()
def list_users():
    """Admin only: every user, for the profile search."""
    if current_user.UserRole != "admin":
        return {"errorCode": "13", "error": "unauthorized"}, 403

    users = db.session.execute(db.select(User).order_by(User.UserFullName)).scalars()
    return [
        {"id": str(user.UserID), "name": user.UserFullName, "email": user.Email, "role": user.UserRole}
        for user in users
    ]

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
