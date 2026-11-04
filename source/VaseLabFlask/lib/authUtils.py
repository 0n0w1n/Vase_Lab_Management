from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError
from flask_jwt_extended import current_user

ph = PasswordHasher()

STAFF = {"admin", "lab_manager", "lab_ta"}
FILE_MANAGERS = {"admin", "lab_manager"}
CLOSED_REQUEST_STATES = {"close", "reject"}

def can_read_request(user, req) -> bool:
    """Allow the request owner and staff to read a request."""
    return req.UserID == user.UserID or user.UserRole in STAFF

def can_read_request_files(user, req, assignment_state: str | None) -> bool:
    """Allow the owner, managers and approved TAs to read a request's files"""
    if req.UserID == user.UserID or user.UserRole in FILE_MANAGERS:
        return True
    return user.UserRole == "lab_ta" and assignment_state == "Approved"

def can_add_request_files(user, req) -> bool:
    """Allow the owner and managers to add files; approved TAs only read them."""
    return req.UserID == user.UserID or user.UserRole in FILE_MANAGERS

def can_upload_now(user, req) -> bool:
    """Allow adding files only while the request is still open."""
    return can_add_request_files(user, req) and req.RequestState not in CLOSED_REQUEST_STATES

def hash_password(password: str) -> str:
    return ph.hash(password)

def verify_password(stored_hash: str, password: str) -> bool:
    try:
        ph.verify(stored_hash, password)
        return True
    except (VerifyMismatchError, VerificationError):
        return False

def is_manager():
    return current_user.UserRole == "lab_manager"