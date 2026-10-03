"""
Hugo : I create the password hasher instance inside this file
then create 'helper' functions to be called in other files
IMPORTANT CLARIFICATIONS ON THE ERRORS IMPORTED :
- Verification error : hash correct but check fail 
|- VerifyMismatchError : More precise , wrong password
"""
from flask import Blueprint, request
from extensions import db, jwt
from flask_jwt_extended import create_access_token
from models import *
from argon2 import PasswordHasher
from lib.requestUtils import verify_user_input
from lib.authUtils import verify_password

ph = PasswordHasher()

auth_api = Blueprint("auth_api", __name__)

INVALID_HASH = ph.hash("invalid")


@jwt.user_identity_loader
def user_identity_lookup(user: User):
    return str(user.UserID)

@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    user = db.session.execute(db.select(User).where(User.UserID == identity)).scalar()
    return user

@auth_api.post("/login")
def login():

    EXPECTED_KEYS = ["email", "password"]
    user_input = request.get_json(silent=True)

    result = verify_user_input(user_input, EXPECTED_KEYS)
    if result[1] != 200:
        return result

    user = db.session.execute(db.select(User).where(User.Email == user_input["email"])).scalar()
    if user is None:
        password = (INVALID_HASH, INVALID_HASH) # doing this so invalid users and invalid passwords have the same timing
    else:
        user: User
        password = (user.PasswordHash, user_input["password"])

    if not verify_password(*password):
        return {"errorCode": "30", "error": "Invalid user/password"}, 401

    return {"access_token": create_access_token(identity=user)}
