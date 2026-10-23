from flask import Blueprint
from flask_jwt_extended import current_user, jwt_required

from extensions import db
from models import Equipment, Request, User
from views.dashboardviews import ACTIVE_STATES
from views.requestviews import STAFF

equipment_api = Blueprint("equipment_api", __name__)

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
