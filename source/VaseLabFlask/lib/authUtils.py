from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError
from flask_jwt_extended import current_user

ph = PasswordHasher()

STAFF = {"admin", "lab_manager", "lab_ta"}

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