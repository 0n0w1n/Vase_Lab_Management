from flask import Blueprint, request
from flask_jwt_extended import current_user, jwt_required

from extensions import db
from models import ActivityLog, Equipment, Request, User
from lib.requestUtils import ACTIVE_STATES, iso, verify_user_input
from lib.authUtils import STAFF

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
