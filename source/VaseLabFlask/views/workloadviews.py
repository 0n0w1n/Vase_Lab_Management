from datetime import datetime

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
    now = datetime.utcnow()
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


# Workload is derived from assignments; no separate workload table is needed.
# POST assigns a TA, PATCH changes the assignment state, DELETE unassigns them.
@workload_api.route("/<int:request_id>/<int:ta_id>", methods=["POST", "PATCH", "DELETE"])
@jwt_required()
def change_workload(request_id: int, ta_id: int):
    if not is_manager():
        return {"errorCode": "11", "error": "Unauthorized"}, 403

    req = db.session.execute(
        db.select(Request).where(Request.RequestID == request_id).with_for_update()
    ).scalar_one_or_none()
    ta = db.session.get(User, ta_id)
    if req is None or ta is None or ta.UserRole != "lab_ta":
        return {"errorCode": "10", "error": "Not found"}, 404
    if req.RequestState not in ACTIVE_STATES:
        return {"errorCode": "31", "error": "Request is no longer open"}, 409

    assignment = db.session.get(RequestAssignment, (request_id, ta_id))
    if request.method == "POST" and assignment is not None:
        return {"errorCode": "32", "error": "Already assigned or asked"}, 409
    if request.method != "POST" and assignment is None:
        return {"errorCode": "10", "error": "Not found"}, 404

    state = "Approved"
    if request.method == "PATCH":
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict) or set(payload) != {"state"}:
            return {"errorCode": "12", "error": "Expected state"}, 400
        state = payload["state"]
        if not isinstance(state, str) or state not in ("Waiting", "Approved", "Refused"):
            return {"errorCode": "12", "error": "Invalid state"}, 400

    if request.method != "DELETE" and state == "Approved" and (
        assignment is None or assignment.State != "Approved"
    ):
        count = db.session.scalar(
            db.select(func.count()).select_from(RequestAssignment).where(
                RequestAssignment.RequestID == request_id,
                RequestAssignment.State == "Approved",
            )
        )
        if count >= req.Capacity:
            return {"errorCode": "30", "error": "Request capacity reached"}, 409

    old_value = {"Assignment": {"UserID": ta_id, "State": assignment.State}} if assignment else None
    new_value = {"Assignment": None}
    if request.method == "DELETE":
        db.session.delete(assignment)
    else:
        if assignment is None:
            assignment = RequestAssignment(RequestID=request_id, UserID=ta_id)
            db.session.add(assignment)
        assignment.State = state
        assignment.DecidedAt = None if state == "Waiting" else datetime.utcnow()
        new_value = {"Assignment": {"UserID": ta_id, "State": state}}
        if state == "Approved" and req.RequestState == "pending":
            old_value = {**(old_value or {}), "RequestState": req.RequestState}
            req.RequestState = "in-progress"
            new_value["RequestState"] = req.RequestState

    db.session.add(ActivityLog(
        UserID=current_user.UserID, Action="update", EntityType="request",
        EntityID=request_id, OldValue=old_value, NewValue=new_value,
    ))
    db.session.commit()
    return {}, 201 if request.method == "POST" else 200
