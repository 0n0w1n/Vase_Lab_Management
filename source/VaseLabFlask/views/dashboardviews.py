from datetime import datetime, timezone

from flask import Blueprint
from flask_jwt_extended import current_user, jwt_required
from sqlalchemy import func

from VaseLabFlask.extensions import db
from VaseLabFlask.models import ActivityLog, Request, RequestAssignment, User

from VaseLabFlask.lib.requestUtils import ACTIVE_STATES, ASSIGNMENT_STATES, iso, reopen_if_no_tas
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
    # Asks to join plus asks to leave: both wait on the lab manager
    waiting_count = db.session.scalar(
        db.select(func.count())
        .select_from(RequestAssignment)
        .where(
            (RequestAssignment.State == "Waiting")
            | RequestAssignment.LeaveRequestedAt.is_not(None)
        )
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
    # Same filter as completed_count, so the list always matches the card's number
    completed_rows = db.session.execute(
        db.select(Request, User)
        .join(User, Request.UserID == User.UserID)
        .where(
            Request.CompletedAt >= month_start,
            Request.CompletedAt < next_month,
        )
        .order_by(Request.CompletedAt.desc(), Request.RequestID.desc())
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

    # One row shape for both lists, so the table renders them the same way
    def table_row(req, requester):
        return {
            "id": str(req.RequestID),
            "title": req.RequestTitle,
            "requestedBy": requester.UserFullName,
            "status": req.RequestState,
            "priority": req.RequestPriority,
            "isEquipment": req.EquipmentID is not None,
            "owner": owners.get(req.RequestID),
            "createdAt": iso(req.CreatedAt),
        }

    return {
        "stats": {
            "totalActive": active_count or 0,
            "pendingApproval": waiting_count or 0,
            "inProgress": in_progress_count or 0,
            "completedThisMonth": completed_count or 0,
        },
        "requests": [table_row(req, requester) for req, requester in rows],
        "completed": [table_row(req, requester) for req, requester in completed_rows],
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

    result = []
    for assignment, req, ta in rows:
        item = {
            # RequestAssignment has a composite key; this pair is its stable API id.
            # A leave ask shares it: decide_assignment tells them apart by the row's state.
            "id": f"{assignment.RequestID}-{assignment.UserID}",
            "kind": "join",
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
        result.append(item)
        # An approved TA asking to leave is a second, still-waiting decision
        if assignment.LeaveRequestedAt is not None:
            result.append({
                **item,
                "kind": "leave",
                "state": "waiting",
                "message": "",
                "askedAt": iso(assignment.LeaveRequestedAt),
                "decidedAt": None,
            })
    # Newest first, so leave asks mix in with join asks by when they were made
    return sorted(result, key=lambda ask: ask["askedAt"] or "", reverse=True)


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

    # An approved TA who asked to leave: approve takes them off, decline keeps them
    if assignment.State == "Approved" and assignment.LeaveRequestedAt is not None:
        db.session.add(ActivityLog(
            EntityType="request",
            Action="update-decide-leave",
            EntityID=request_obj.RequestID,
            fields={
                "userID": assignment.UserID,
                "decision": "Approved" if decision == "approve" else "Refused",
            }
        ))
        if decision == "approve":
            db.session.delete(assignment)
            db.session.flush()
            reopen_if_no_tas(request_obj)
        else:
            assignment.LeaveRequestedAt = None
        db.session.commit()
        return {}

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

    assignment.DecidedAt = datetime.now(timezone.utc)

    db.session.add(ActivityLog(
        EntityType="request",
        Action="update-decide-assignment",
        EntityID=request_obj.RequestID,
        fields={
            "userID": assignment.UserID,
            "decision": assignment.State,
        }
    ))
    if assignment.State == "Approved" and request_obj.RequestState == "pending":
        request_obj.RequestState = "in-progress"
        db.session.add(ActivityLog(
            EntityType="request",
            Action="update-status",
            EntityID=request_obj.RequestID,
            fields={
                "status": request_obj.RequestState
            }
        ))
    db.session.commit()
    return {}
