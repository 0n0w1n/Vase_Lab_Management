from datetime import datetime

from models import Request, RequestAssignment, User
from .base import get_one, get_or_create

# (request title, TA email, state, message)
ROWS = [
    (
        "Lab Access Card — New Research Assistant",
        "ta@lab.local",
        "Waiting",
        "I can prepare the access card.",
    ),
    (
        "Cold Room Temperature Alarm",
        "sarah.jenkins@lab.local",
        "Waiting",
        "I can inspect the temperature logs.",
    ),
    (
        "Microscope Imaging Software Update",
        "sarah.jenkins@lab.local",
        "Approved",
        "I can help update and test the workstation.",
    ),
]


def run():
    created = 0
    for request_title, email, state, message in ROWS:
        request = get_one(Request, RequestTitle=request_title)
        user = get_one(User, Email=email)
        _, new = get_or_create(
            RequestAssignment,
            {"RequestID": request.RequestID, "UserID": user.UserID},
            State=state,
            Message=message,
            DecidedAt=datetime.utcnow() if state != "Waiting" else None,
        )
        created += new
    return created
