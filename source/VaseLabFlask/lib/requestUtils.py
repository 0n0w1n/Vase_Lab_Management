# please make sure it is actually needed in multiple places and not put here for the sake of it T_T

from sqlalchemy import func

from VaseLabFlask.extensions import db
from VaseLabFlask.models import ActivityLog, RequestAssignment

REQUEST_STATES = ("pending", "in-progress", "review", "close", "reject")
ACTIVE_STATES = ("pending", "in-progress", "review")
ASSIGNMENT_STATES = {
    "Waiting": "waiting",
    "Approved": "approved",
    "Refused": "declined",
}

def verify_user_input(input_json, expected_keys):

    if input_json is None:
        return {"errorCode": "10", "error": "JSON unparseable"}, 400
    if type(input_json) != dict:
        return {"errorCode": "11", "error": "Not valid JSON"}, 400
    input_json: dict

    input_keys = input_json.keys()
    for i, expected_key in enumerate(expected_keys):
        if expected_key not in input_keys:
            return {"errorCode": f"2{i}", "error": f"Key '{expected_key}' not found"}, 400

    return {"errorCode": "0", "error": "None"}, 200

def reopen_if_no_tas(req):
    """Move an in-progress request back to pending once its last approved TA is gone.

    Used when the manager unassigns a TA (requestviews) and when they approve
    a TA's leave (dashboardviews). Call after the assignment row is deleted.
    """
    approved = db.session.scalar(
        db.select(func.count()).select_from(RequestAssignment).where(
            RequestAssignment.RequestID == req.RequestID,
            RequestAssignment.State == "Approved",
        )
    )
    if approved == 0 and req.RequestState == "in-progress":
        req.RequestState = "pending"
        db.session.add(ActivityLog(
            EntityType="request",
            Action="update-status",
            EntityID=req.RequestID,
            fields={"status": req.RequestState},
        ))

# TODO: Rework datetime parsing to Flask's default rather than managing our own function
def iso(value):
    return value.isoformat() + "Z" if value else None