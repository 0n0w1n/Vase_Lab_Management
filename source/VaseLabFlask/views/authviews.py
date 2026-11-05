"""
Hugo : I create the password hasher instance inside this file
then create 'helper' functions to be called in other files
IMPORTANT CLARIFICATIONS ON THE ERRORS IMPORTED :
- Verification error : hash correct but check fail 
|- VerifyMismatchError : More precise , wrong password
"""
from flask import Blueprint, request
from flask_jwt_extended import create_access_token, current_user, jwt_required
from argon2 import PasswordHasher
from VaseLabFlask.models import User
from VaseLabFlask.extensions import db, jwt
from VaseLabFlask.lib.requestUtils import verify_user_input
from VaseLabFlask.lib.authUtils import verify_password, hash_password
from sqlalchemy.exc import IntegrityError

ph = PasswordHasher()

auth_api = Blueprint("auth_api", __name__)

INVALID_HASH = ph.hash("invalid")


@jwt.user_identity_loader
def user_identity_lookup(user: User):
    return str(user.UserID)


@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    user = db.session.execute(db.select(User).where(
        User.UserID == identity)).scalar()
    return user


@auth_api.post("/login")
def login():

    EXPECTED_KEYS = ["email", "password"]
    user_input = request.get_json(silent=True)

    result = verify_user_input(user_input, EXPECTED_KEYS)
    if result[1] != 200:
        return result

    user = db.session.execute(db.select(User).where(
        User.Email == user_input["email"])).scalar()
    if user is None:
        # doing this so invalid users and invalid passwords have the same timing
        password = (INVALID_HASH, INVALID_HASH)
    else:
        user: User
        password = (user.PasswordHash, user_input["password"])

    if not verify_password(*password):
        return {"errorCode": "30", "error": "Invalid user/password"}, 401

    return {"access_token": create_access_token(identity=user)}


@auth_api.post("/register")
@jwt_required()
def register():
    # Check the caller's database role, never a role supplied by the client.
    if current_user.UserRole != "admin":
        return {"errorCode": "40", "error": "Admin access required"}, 403

    EXPECTED_KEYS = ["name", "email", "password", "role"]
    # read JSON from NextJS;Return none if unreadable
    user_input = request.get_json(silent=True)

    result = verify_user_input(user_input, EXPECTED_KEYS)

    if result[1] != 200:
        return result

    # Nothing can be None
    if any(not isinstance(user_input[key], str) for key in EXPECTED_KEYS):
        return {
            "errorCode": "30",
            "error": "Name, email, password and role must be strings"
        }, 400

    # Remove surrounding space from input

    name = user_input["name"].strip()
    email = user_input["email"].strip()

    password = user_input["password"]
    role = user_input["role"]
    organization = user_input.get("organization", "")

    if role not in {"admin", "lab_manager", "lab_ta", "lab_member", "visitor"}:
        return {"errorCode": "35", "error": "Invalid role"}, 400
    if not isinstance(organization, str) or len(organization.strip()) > 150:
        return {"errorCode": "36", "error": "Invalid organization"}, 400
    organization = organization.strip() or None

    if not 1 <= len(name) <= 255:
        return {
            "errorCode": "31",
            "error": "Name must contain between 1 and 255 characters",
        }, 400

    if (
        not 3 <= len(email) <= 254
        or email.count("@") != 1
        or email.startswith("@")
        or email.endswith("@")
        or any(character.isspace() for character in email)
    ):
        return {
            "errorCode": "32",
            "error": "Invalid email",
        }, 400

    # Match the 12–128 character policy in your password-update endpoint.
    if not 12 <= len(password) <= 128:
        return {
            "errorCode": "33",
            "error": "Password must contain between 12 and 128 characters",
        }, 400

    existing_user = db.session.execute(
        db.select(User).where(User.Email == email)
    ).scalar_one_or_none()

    if existing_user is not None:
        return {
            "errorCode": "34",
            "error": "Email already registered",
        }, 409

    user = User(
        UserFullName=name,
        Email=email,
        PasswordHash=hash_password(password),  # Store an Argon2 hash.
        UserRole=role,
        UserOrganization=organization,
    )

    db.session.add(user)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()

        # Two requests could pass the earlier email check simultaneously.
        existing_user = db.session.execute(
            db.select(User).where(User.Email == email)
        ).scalar_one_or_none()

        if existing_user is not None:
            return {
                "errorCode": "34",
                "error": "Email already registered",
            }, 409
        raise

    # Return JSON with HTTP 201: a new account was created successfully.
    return {"id": str(user.UserID)}, 201
