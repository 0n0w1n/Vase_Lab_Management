"""
Hugo : I create the password hasher instance inside this file
then create 'helper' functions to be called in other files
IMPORTANT CLARIFICATIONS ON THE ERRORS IMPORTED :
- Verification error : hash correct but check fail 
|- VerifyMismatchError : More precise , wrong password
"""
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError

ph = PasswordHasher()


def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(stored_hash: str, password: str) -> bool:
    try:
        ph.verify(stored_hash, password)
        return True
    except (VerifyMismatchError, VerificationError ):
        return False