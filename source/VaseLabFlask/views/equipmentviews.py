from flask import Blueprint, request
from flask_jwt_extended import current_user, jwt_required

from extensions import db
from models import ActivityLog, Equipment, Request, User
from lib.requestUtils import ACTIVE_STATES, iso, verify_user_input
from lib.authUtils import STAFF, MANAGERS

equipment_api = Blueprint("equipment_api", __name__)

FIELD_LABELS = {
    "EquipmentName": "Name",
    "EquipmentModel": "Model",
    "EquipmentState": "State",
    "EquipmentDescription": "Description",
}

def _date(value):
    return value.date().isoformat() if value else None

def _active_borrows(*where):
    rows = db.session.execute(
        db.select(Request, User)
        .join(User, Request.UserID == User.UserID)
        .where(
            Request.EquipmentID.is_not(None),
            Request.RequestState.in_(ACTIVE_STATES),
            *where,
        )
        .order_by(Request.CreatedAt.desc(), Request.RequestID.desc())
    ).all()
    borrows = {}
    for req, requester in rows:
        borrows.setdefault(req.EquipmentID, (req, requester))
    return borrows

def _serialize(equipment: Equipment, borrow):
    # borrower details when the item is out
    req, requester = borrow if equipment.EquipmentState == "in_use" and borrow else (None, None)
    return {
        "id": equipment.EquipmentID,
        "name": equipment.EquipmentName,
        "model": equipment.EquipmentModel,
        "state": equipment.EquipmentState,
        "description": equipment.EquipmentDescription,
        "addedAt": _date(equipment.CreatedAt),
        "currentUser": requester.UserFullName if requester else None,
        "expectedReturn": _date(req.RequestDeadline) if req else None,
    }

def _describe(log: ActivityLog):
    if log.Action == "create":
        return "Equipment added"
    if log.Action == "delete":
        return "Equipment removed"
    old = log.OldValue or {}
    changes = []
    for field, new in (log.NewValue or {}).items():
        label = FIELD_LABELS.get(field, field)
        if field == "EquipmentState" and field in old:
            changes.append(f"{label} changed from {old[field].replace('_', ' ')} to {new.replace('_', ' ')}")
        else:
            changes.append(f"{label} edited")
    return ", ".join(changes) or "Equipment updated"

@equipment_api.get("/list")
@jwt_required()
def get_equipment_list():
    equipment = db.session.scalars(
        db.select(Equipment).order_by(Equipment.EquipmentID)
    ).all()
    borrows = _active_borrows()
    return [_serialize(item, borrows.get(item.EquipmentID)) for item in equipment]

@equipment_api.get("/details/<int:equipment_id>")
@jwt_required()
def get_equipment_details(equipment_id: int):
    equipment = db.session.get(Equipment, equipment_id)
    if equipment is None:
        return {"errorCode": "10", "error": "Not found"}, 404
    borrows = _active_borrows(Request.EquipmentID == equipment_id)
    return _serialize(equipment, borrows.get(equipment_id))

@equipment_api.get("/usage/<int:equipment_id>")
@jwt_required()
def get_equipment_usage(equipment_id: int):
    if db.session.get(Equipment, equipment_id) is None:
        return {"errorCode": "10", "error": "Not found"}, 404

    rows = db.session.execute(
        db.select(Request, User)
        .join(User, Request.UserID == User.UserID)
        .where(Request.EquipmentID == equipment_id)
        .order_by(Request.CreatedAt.desc(), Request.RequestID.desc())
    ).all()

    is_staff = current_user.UserRole in STAFF
    result = []
    for req, requester in rows:
        # members only see who and when except on their own requests
        visible = is_staff or req.UserID == current_user.UserID
        result.append({
            "requestId": req.RequestID if visible else None,
            "requestedBy": requester.UserFullName,
            "status": req.RequestState if visible else None,
            "deadline": _date(req.RequestDeadline),
        })
    return result

@equipment_api.get("/activity/<int:equipment_id>")
@jwt_required()
def get_equipment_activity(equipment_id: int):
    if db.session.get(Equipment, equipment_id) is None:
        return {"errorCode": "10", "error": "Not found"}, 404

    rows = db.session.execute(
        db.select(ActivityLog, User)
        .join(User, ActivityLog.UserID == User.UserID)
        .where(
            ActivityLog.EntityType == "equipment",
            ActivityLog.EntityID == equipment_id,
        )
        .order_by(ActivityLog.CreatedAt.desc(), ActivityLog.LogID.desc())
    ).all()

    return [
        {
            "id": log.LogID,
            "action": _describe(log),
            "by": actor.UserFullName,
            "at": iso(log.CreatedAt),
        }
        for log, actor in rows
    ]

@equipment_api.post("/create")
@jwt_required()
def create_equipment():
    if current_user.UserRole not in STAFF:
        return {"errorCode": "12", "error": "Unauthorized"}, 403

    data = request.get_json(silent=True)
    result = verify_user_input(data, ["name", "model", "state", "description"])
    if result[1] != 200:
        return result

    name = data["name"]
    model = data["model"]
    state = data["state"]
    description = data["description"]

    if not isinstance(name, str) or not name.strip():
        return {"errorCode": "20", "error": "Name is required"}, 400
    if len(name.strip()) > 140:
        return {"errorCode": "20", "error": "Name is too long"}, 400
    if not isinstance(model, str) or len(model.strip()) > 140:
        return {"errorCode": "21", "error": "Model is too long"}, 400
    if state not in {"available", "in_use", "maintenance", "retired"}:
        return {"errorCode": "22", "error": "Invalid state"}, 400
    if not isinstance(description, str):
        return {"errorCode": "23", "error": "Invalid description"}, 400

    equipment = Equipment(
        EquipmentName=name.strip(),
        EquipmentModel=model.strip() or None,
        EquipmentState=state,
        EquipmentDescription=description.strip() or None,
    )
    db.session.add(equipment)
    db.session.flush()

    db.session.add(ActivityLog(
        UserID=current_user.UserID,
        Action="create",
        EntityType="equipment",
        EntityID=equipment.EquipmentID,
        NewValue={
            "EquipmentName": equipment.EquipmentName,
            "EquipmentModel": equipment.EquipmentModel,
            "EquipmentState": equipment.EquipmentState,
            "EquipmentDescription": equipment.EquipmentDescription,
        },
    ))
    db.session.commit()

    return {"id": equipment.EquipmentID}, 201

@equipment_api.post("/edit/<int:equipment_id>")
@jwt_required()
def edit_equipment(equipment_id: int):
    if current_user.UserRole not in MANAGERS:
        return {"errorCode": "12", "error": "Unauthorized"}, 403

    equipment = db.session.get(Equipment, equipment_id)
    if equipment is None:
        return {"errorCode": "13", "error": "Not found"}, 404

    data = request.get_json(silent=True)
    result = verify_user_input(data, ["name", "model", "state", "description"])
    if result[1] != 200:
        return result

    name = data["name"]
    model = data["model"]
    state = data["state"]
    description = data["description"]

    if not isinstance(name, str) or not name.strip():
        return {"errorCode": "20", "error": "Name is required"}, 400
    if len(name.strip()) > 140:
        return {"errorCode": "20", "error": "Name is too long"}, 400
    if not isinstance(model, str) or len(model.strip()) > 140:
        return {"errorCode": "21", "error": "Model is too long"}, 400
    if state not in {"available", "in_use", "maintenance", "retired"}:
        return {"errorCode": "22", "error": "Invalid state"}, 400
    if not isinstance(description, str):
        return {"errorCode": "23", "error": "Invalid description"}, 400

    new = {
        "EquipmentName": name.strip(),
        "EquipmentModel": model.strip() or None,
        "EquipmentState": state,
        "EquipmentDescription": description.strip() or None,
    }
    # changed fields only
    old = {k: getattr(equipment, k) for k in new if getattr(equipment, k) != new[k]}
    if not old:
        return {}, 200

    changed = {k: new[k] for k in old}
    for k, v in changed.items():
        setattr(equipment, k, v)

    db.session.add(ActivityLog(
        UserID=current_user.UserID,
        Action="update",
        EntityType="equipment",
        EntityID=equipment_id,
        OldValue=old,
        NewValue=changed,
    ))
    db.session.commit()
    return {}, 200

@equipment_api.post("/delete/<int:equipment_id>")
@jwt_required()
def delete_equipment(equipment_id: int):
    # Deleting can't be undone, so stricter than create: no TAs
    if current_user.UserRole not in {"admin", "lab_manager"}:
        return {"errorCode": "12", "error": "Unauthorized"}, 403

    equipment = db.session.get(Equipment, equipment_id)
    if equipment is None:
        return {"errorCode": "10", "error": "Not found"}, 404

    # Requests keep a foreign key to the equipment and are its usage history,
    # so anything ever used must be retired instead of deleted
    used = db.session.scalar(
        db.select(Request.RequestID).where(Request.EquipmentID == equipment_id).limit(1)
    )
    if used is not None:
        return {"errorCode": "30", "error": "Equipment has request history"}, 409

    # Snapshot first, so the log still records what was removed
    db.session.add(ActivityLog(
        UserID=current_user.UserID,
        Action="delete",
        EntityType="equipment",
        EntityID=equipment.EquipmentID,
        OldValue={
            "EquipmentName": equipment.EquipmentName,
            "EquipmentModel": equipment.EquipmentModel,
            "EquipmentState": equipment.EquipmentState,
            "EquipmentDescription": equipment.EquipmentDescription,
        },
    ))
    db.session.delete(equipment)
    db.session.commit()

    return {}

"""
The delete endpoint is written and compiles. I haven't called it yet, because your dev stack isn't running; the steps to test it are below. No migration or seed changes were needed.

What it does: POST /equipment/delete/<id> in equipmentviews.py

Only the admin and lab managers can delete.
Equipment that has ever been used in a request is refused, so its usage history stays intact. Your colleague's edit feature can set it to retired instead.
Otherwise it deletes the row and writes an activity log entry recording the full item.
Testing it
Start the stack with docker compose up --watch, log in to get a token, then try these cases. Every seeded item is used by a request, so to see a successful delete you create a fresh item first.

Case	How	Expected
Unused item	As the manager: POST /equipment/create, then POST /equipment/delete/<new id>	200 {}, and the item is gone from /equipment/list
Used item	As the manager: POST /equipment/delete/1	409, errorCode: "30"
Doesn't exist	As the manager: POST /equipment/delete/9999	404, errorCode: "10"
Wrong role	As ta@lab.local: delete anything	403, errorCode: "12"
From PowerShell, for example:


$token = (Invoke-RestMethod -Method Post -Uri http://localhost:8000/auth/login -ContentType "application/json" -Body '{"email":"manager@lab.local","password":"manager123"}').access_token
Invoke-RestMethod -Method Post -Uri http://localhost:8000/equipment/delete/1 -Headers @{Authorization="Bearer $token"}
For your colleague hooking up the button
Written for: your colleague building the equipment edit and the delete button.

Delete equipment: POST /equipment/delete/<id>, no body, with the user's token (authFetch). Returns {} on success.

Button visibility: show it only to the admin and lab managers. TAs can create equipment but can't delete it.
On 30 (409): the item has request history and can't be deleted. Suggest retiring it with your edit form instead.
On 10: not found. On 12: not allowed.
Error text from Flask is for documentation only, so put your own wording in the frontend.
After success: go back to the equipment list. The detail and activity pages for that ID return 404 once it's deleted.
For the backend lead
Flask's AGENTS.md asks you to tell them about new endpoints so they can add them to the spec:

New: POST /equipment/delete/<id>, admin or lab manager only. Hard-deletes equipment that has never been used in a request, and logs it as an equipment delete with the item in OldValue. Errors: 10 not found (404), 12 unauthorized (403), 30 has request history (409).

When you deal with the branch later: this change only appends to the end of the file, so it will move to a fresh branch from main, or merge with main, without conflicts.

"""