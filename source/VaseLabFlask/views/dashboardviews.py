from datetime import datetime

from flask import Blueprint
from flask_jwt_extended import current_user, jwt_required
from sqlalchemy import func

from VaseLabFlask.extensions import db
from VaseLabFlask.models import ActivityLog, Request, RequestAssignment, User

from VaseLabFlask.lib.requestUtils import ACTIVE_STATES, ASSIGNMENT_STATES, iso
from VaseLabFlask.lib.authUtils import is_manager

dashboard_api = Blueprint("dashboard_api", __name__)

@dashboard_api.get("")
@jwt_required()
def get_dashboard():
    if not is_manager():
        return {"errorCode": "11", "error": "Unauthorized"}, 403

    active_count = db.session.scalar(
        db.select(func.count(Request.RequestID)).where(
            Request.RequestState.in_(ACTIVE_STATES)
        )
    )
    in_progress_count = db.session.scalar(
        db.select(func.count(Request.RequestID)).where(
            Request.RequestState == "in-progress"
        )
    )
    waiting_count = db.session.scalar(
        db.select(func.count())
        .select_from(RequestAssignment)
        .where(RequestAssignment.State == "Waiting")
    )

    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    next_month = datetime(now.year + (now.month == 12), now.month % 12 + 1, 1)
    completed_count = db.session.scalar(
        db.select(func.count(Request.RequestID)).where(
            Request.CompletedAt >= month_start,
            Request.CompletedAt < next_month,
        )
    )

    rows = db.session.execute(
        db.select(Request, User)
        .join(User, Request.UserID == User.UserID)
        .where(Request.RequestState.in_(ACTIVE_STATES))
        .order_by(Request.CreatedAt.desc(), Request.RequestID.desc())
    ).all()

    approved_owners = db.session.execute(
        db.select(RequestAssignment.RequestID, User.UserFullName)
        .join(User, RequestAssignment.UserID == User.UserID)
        .where(RequestAssignment.State == "Approved")
        .order_by(
            RequestAssignment.DecidedAt.desc(),
            RequestAssignment.UserID.asc(),
        )
    ).all()
    owners = {}
    for request_id, name in approved_owners:
        owners.setdefault(request_id, name)

    return {
        "stats": {
            "totalActive": active_count or 0,
            "pendingApproval": waiting_count or 0,
            "inProgress": in_progress_count or 0,
            "completedThisMonth": completed_count or 0,
        },
        "requests": [
            {
                "id": str(req.RequestID),
                "title": req.RequestTitle,
                "requestedBy": requester.UserFullName,
                "status": req.RequestState,
                "priority": req.RequestPriority,
                "isEquipment": req.EquipmentID is not None,
                "owner": owners.get(req.RequestID),
                "createdAt": iso(req.CreatedAt),
            }
            for req, requester in rows
        ],
    }


@dashboard_api.get("/decisions")
@jwt_required()
def get_decisions():
    if not is_manager():
        return {"errorCode": "11", "error": "Unauthorized"}, 403

    rows = db.session.execute(
        db.select(RequestAssignment, Request, User)
        .join(Request, RequestAssignment.RequestID == Request.RequestID)
        .join(User, RequestAssignment.UserID == User.UserID)
        .order_by(
            RequestAssignment.CreatedAt.desc(),
            RequestAssignment.RequestID.desc(),
            RequestAssignment.UserID.asc(),
        )
    ).all()

    approved_by_request = db.session.execute(
        db.select(RequestAssignment.RequestID, func.count())
        .where(RequestAssignment.State == "Approved")
        .group_by(RequestAssignment.RequestID)
    ).all()
    assigned_counts = dict(approved_by_request)

    approved_by_ta = db.session.execute(
        db.select(RequestAssignment.UserID, func.count())
        .join(Request, RequestAssignment.RequestID == Request.RequestID)
        .where(
            RequestAssignment.State == "Approved",
            Request.RequestState.in_(ACTIVE_STATES),
        )
        .group_by(RequestAssignment.UserID)
    ).all()
    open_counts = dict(approved_by_ta)

    return [
        {
            # RequestAssignment has a composite key; this pair is its stable API id.
            "id": f"{assignment.RequestID}-{assignment.UserID}",
            "state": ASSIGNMENT_STATES[assignment.State],
            "message": assignment.Message or "",
            "askedAt": iso(assignment.CreatedAt),
            "decidedAt": iso(assignment.DecidedAt),
            "request": {
                "id": str(req.RequestID),
                "title": req.RequestTitle,
                "priority": req.RequestPriority,
                "createdAt": iso(req.CreatedAt),
                "capacity": req.Capacity,
                "assignedCount": assigned_counts.get(req.RequestID, 0),
            },
            "ta": {
                "id": str(ta.UserID),
                "name": ta.UserFullName,
                "initials": "".join(
                    part[0].upper()
                    for part in ta.UserFullName.split()
                    if part
                )[:2],
                "openCount": open_counts.get(ta.UserID, 0),
            },
        }
        for assignment, req, ta in rows
    ]


@dashboard_api.post("/decisions/<assignment_id>/<decision>")
@jwt_required()
def decide_assignment(assignment_id: str, decision: str):
    if not is_manager():
        return {"errorCode": "11", "error": "Unauthorized"}, 403
    if decision not in {"approve", "decline"}:
        return {"errorCode": "12", "error": "Invalid decision"}, 400

    request_id, separator, user_id = assignment_id.partition("-")
    if not separator or not request_id.isdigit() or not user_id.isdigit():
        return {"errorCode": "10", "error": "Not found"}, 404

    request_obj = db.session.execute(
        db.select(Request)
        .where(Request.RequestID == int(request_id))
        .with_for_update()
    ).scalar_one_or_none()
    if request_obj is None:
        return {"errorCode": "10", "error": "Not found"}, 404

    assignment = db.session.get(
        RequestAssignment, (int(request_id), int(user_id))
    )
    if assignment is None:
        return {"errorCode": "10", "error": "Not found"}, 404
    if assignment.State != "Waiting":
        return {"errorCode": "31", "error": "This ask was already decided"}, 409

    if decision == "approve":
        approved_count = db.session.scalar(
            db.select(func.count())
            .select_from(RequestAssignment)
            .where(
                RequestAssignment.RequestID == request_obj.RequestID,
                RequestAssignment.State == "Approved",
            )
        )
        if (approved_count or 0) >= request_obj.Capacity:
            return {"errorCode": "30", "error": "Request capacity reached"}, 409
        assignment.State = "Approved"
    else:
        assignment.State = "Refused"

    assignment.DecidedAt = datetime.utcnow()

    old_value = {}
    new_value = {"Assignment": {"UserID": assignment.UserID, "State": assignment.State}}
    # AD-2: the first approved TA starts the work
    if assignment.State == "Approved" and request_obj.RequestState == "pending":
        old_value["RequestState"] = request_obj.RequestState
        request_obj.RequestState = "in-progress"
        new_value["RequestState"] = request_obj.RequestState

    db.session.add(ActivityLog(
        UserID=current_user.UserID,
        Action="update",
        EntityType="request",
        EntityID=request_obj.RequestID,
        OldValue=old_value or None,
        NewValue=new_value,
    ))
    db.session.commit()
    return {}
