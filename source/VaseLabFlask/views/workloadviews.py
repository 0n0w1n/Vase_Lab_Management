from datetime import datetime, timezone

from flask import Blueprint, request
from flask_jwt_extended import current_user, jwt_required
from sqlalchemy import func

from VaseLabFlask.extensions import db
from VaseLabFlask.models import ActivityLog, Request, RequestAssignment, User
from VaseLabFlask.lib.requestUtils import ACTIVE_STATES, iso
from VaseLabFlask.lib.authUtils import is_manager

workload_api = Blueprint("workload_api", __name__)


@workload_api.get("")
@jwt_required()
def get_workload():
    if not is_manager():
        return {"errorCode": "11", "error": "Unauthorized"}, 403

    tas = db.session.scalars(
        db.select(User).where(User.UserRole == "lab_ta")
        .order_by(User.UserFullName, User.UserID)
    ).all()
    rows = db.session.execute(
        db.select(RequestAssignment, Request)
        .join(Request, RequestAssignment.RequestID == Request.RequestID)
        .order_by(Request.CreatedAt, Request.RequestID)
    ).all()
    updates = dict(db.session.execute(
        db.select(ActivityLog.EntityID, func.max(ActivityLog.CreatedAt))
        .where(ActivityLog.EntityType == "request")
        .group_by(ActivityLog.EntityID)
    ).all())
    now = datetime.now(timezone.utc)
    month_start = datetime(now.year, now.month, 1)
    next_month = datetime(now.year + (now.month == 12), now.month % 12 + 1, 1)
    by_ta = {}
    for assignment, req in rows:
        by_ta.setdefault(assignment.UserID, []).append((assignment, req))

    result = []
    for ta in tas:
        assignments = by_ta.get(ta.UserID, [])
        active = [(a, r) for a, r in assignments
                  if a.State == "Approved" and r.RequestState in ACTIVE_STATES]
        result.append({
            "id": str(ta.UserID),
            "name": ta.UserFullName,
            "initials": "".join(part[0].upper() for part in ta.UserFullName.split())[:2],
            "openCount": len(active),
            "highPriority": sum(r.RequestPriority == "high" for _, r in active),
            "oldestOpen": iso(active[0][1].CreatedAt) if active else None,
            "closedThisMonth": sum(
                a.State == "Approved" and r.RequestState == "close"
                and r.CompletedAt is not None and month_start <= r.CompletedAt < next_month
                for a, r in assignments
            ),
            "asksWaiting": sum(a.State == "Waiting" for a, _ in assignments),
            "requests": [{
                "id": str(r.RequestID), "title": r.RequestTitle,
                "status": r.RequestState, "priority": r.RequestPriority,
                "createdAt": iso(r.CreatedAt),
                "updatedAt": iso(max(filter(None, (
                    r.CreatedAt, updates.get(r.RequestID), a.UpdatedAt, a.DecidedAt,
                )))),
            } for a, r in active],
        })
    return sorted(result, key=lambda ta: -ta["openCount"])
