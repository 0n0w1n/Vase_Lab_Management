from extensions import db
from models import ActivityLog, Equipment, User
from .base import get_one, days_from_now

ROWS = [
    # (equipment_name, actor_email, action, old_value, new_value, days_ago)
    ("Confocal Microscope", "manager@lab.local", "create", None, {"EquipmentName": "Confocal Microscope"}, 30),
    ("Confocal Microscope", "manager@lab.local", "update", {"EquipmentState": "available"}, {"EquipmentState": "in_use"}, 3),
    ("Centrifuge - Lab 4B", "manager@lab.local", "create", None, {"EquipmentName": "Centrifuge - Lab 4B"}, 30),
    ("Centrifuge - Lab 4B", "mike.chen@lab.local", "update", {"EquipmentState": "available"}, {"EquipmentState": "maintenance"}, 5),
    ("Centrifuge - Lab 4B", "mike.chen@lab.local", "update", {"EquipmentDescription": "Benchtop centrifuge."}, {"EquipmentDescription": "Benchtop centrifuge, rotor assembly serviced Oct 2023."}, 4),
    ("Cold Room", "manager@lab.local", "create", None, {"EquipmentName": "Cold Room"}, 20),
]


def run():
    exists = db.session.scalar(
        db.select(ActivityLog.LogID).where(ActivityLog.EntityType == "equipment").limit(1)
    )
    if exists:
        return 0
    # for when activity isnt write yet it will write more like init of activity history
    for equipment_name, email, action, old_value, new_value, days_ago in ROWS:
        db.session.add(ActivityLog(
            UserID=get_one(User, Email=email).UserID,
            Action=action,
            EntityType="equipment",
            EntityID=get_one(Equipment, EquipmentName=equipment_name).EquipmentID,
            OldValue=old_value,
            NewValue=new_value,
            CreatedAt=days_from_now(-days_ago),
        ))
    return len(ROWS)
