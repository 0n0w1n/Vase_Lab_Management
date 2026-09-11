from models import Request, User, Equipment
from .base import get_or_create, get_one, dt

# RequestState : pending | in-progress | review | close | reject
ROWS = [
    # (title, requester_email, equipment_name, state, priority, deadline, approved_by, details)
    ("Equipment Maintenance", "definate@lab.local", "Centrifuge - Lab 4B",
     "review", "high", "2023-10-31", None,
     "The centrifuge in Lab 4B is making a loud grinding noise during operation. "
     "Please inspect and perform routine maintenance as soon as possible."),

    ("Reagent Restock — Ethanol 99%", "definate@lab.local", "Solvent Cabinet",
     "in-progress", "medium", "2023-10-27", "Mike Chen",
     "Ethanol stock in the solvent cabinet is down to two bottles. "
     "Requesting a restock of six 1L bottles before the end of the week."),

    ("Fume Hood Airflow Check", "sarah.jenkins@lab.local", "Fume Hood - Lab 2A",
     "close", "low", "2023-11-15", None,
     "Annual airflow certification for the Lab 2A fume hood is due next month. "
     "Booking the inspection ahead of time."),

    ("Lab Access Card — New Research Assistant", "mike.chen@lab.local", "Access Control - Labs 2A/4B",
     "pending", "high", "2023-10-30", None,
     "A new research assistant starts on Monday and needs a keycard with access to Labs 2A and 4B."),

    ("Microscope Imaging Software Update", "definate@lab.local", "Confocal Microscope",
     "in-progress", "medium", "2023-10-28", "Mike Chen",
     "The imaging software on the confocal microscope workstation crashes on export. "
     "Requesting an update to the latest version."),

    ("Nitrile Gloves Order (Size M)", "sarah.jenkins@lab.local", "Teaching Lab PPE Station",
     "reject", "low", "2023-10-26", None,
     "Requesting ten boxes of size M nitrile gloves for the teaching lab."),

    ("Cold Room Temperature Alarm", "definate@lab.local", "Cold Room",
     "pending", "medium", "2023-10-29", None,
     "The cold room alarm has triggered twice overnight. The display reads 6°C against a 4°C setpoint."),
]


def run():
    created = 0
    for title, email, equipment_name, state, priority, deadline, approved_by, details in ROWS:
        user = get_one(User, Email=email)
        equipment = get_one(Equipment, EquipmentName=equipment_name)
        _, new = get_or_create(
            Request, {"RequestTitle": title},
            UserID=user.UserID,
            EquipmentID=equipment.EquipmentID,
            RequestState=state,
            RequestPriority=priority,
            RequestDeadline=dt(deadline),
            AprovedBy=approved_by,
            RequestDetails=details,
        )
        created += new
    return created