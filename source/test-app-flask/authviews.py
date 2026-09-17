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
from argon2.exceptions import VerifyMismatchError, VerificationError

ph = PasswordHasher()

auth_api = Blueprint("auth_api", __name__)

def hash_password(password: str) -> str:
    return ph.hash(password)

def verify_password(stored_hash: str, password: str) -> bool:
    try:
        ph.verify(stored_hash, password)
        return True
    except (VerifyMismatchError, VerificationError ):
        return False

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
    if user_input is None:
        return {"errorCode": "10", "error": "JSON unparseable"}, 400
    if type(user_input) != dict:
        return {"errorCode": "11", "error": "Not valid JSON"}, 400
    user_input: dict

    input_keys = user_input.keys()
    for i, expected_key in enumerate(EXPECTED_KEYS):
        if expected_key not in input_keys:
            return {"errorCode": f"2{i}", "error": f"Key '{expected_key}' not found"}, 400

    user = db.session.execute(db.select(User).where(User.Email == user_input["email"])).scalar()
    if user is None:
        return {"errorCode": "30", "error": "Invalid user/password"}, 401
    user: User

    if not verify_password(user.PasswordHash, user_input["password"]):
        return {"errorCode": "30", "error": "Invalid user/password"}, 401

    return {"access_token": create_access_token(identity=user)}