from datetime import datetime

from VaseLabFlask.models import Request, User, Equipment
from .base import get_or_create, get_one, dt, delete_table, days_from_now

# RequestState: pending | in-progress | review | close | reject
ROWS = [
    # (title, requester_email, equipment_name, state, priority, deadline, capacity, approved_by, details)
    (
        "Equipment Maintenance", "definate@lab.local", "Centrifuge - Lab 4B",
        "review", "high", "2026-10-31", 2, None,
        "The centrifuge in Lab 4B is making a loud grinding noise during operation. "
        "Please inspect and perform routine maintenance as soon as possible.",
    ),
    (
        "Reagent Restock — Ethanol 99%", "definate@lab.local", "Solvent Cabinet",
        "in-progress", "medium", "2026-10-27", 3, "Mike Chen",
        "Ethanol stock in the solvent cabinet is down to two bottles. "
        "Requesting a restock of six 1L bottles before the end of the week.",
    ),
    (
        "Fume Hood Airflow Check", "sarah.jenkins@lab.local", "Fume Hood - Lab 2A",
        "close", "low", "2026-11-15", 5, None,
        "Annual airflow certification for the Lab 2A fume hood is due next month. "
        "Booking the inspection ahead of time.",
    ),
    (
        "Lab Access Card — New Research Assistant", "mike.chen@lab.local",
        "Access Control - Labs 2A/4B", "pending", "high", "2026-10-30", 3, None,
        "A new research assistant starts on Monday and needs a keycard with access to Labs 2A and 4B.",
    ),
    (
        "Microscope Imaging Software Update", "definate@lab.local", "Confocal Microscope",
        "in-progress", "medium", "2026-10-28", 5, "Mike Chen",
        "The imaging software on the confocal microscope workstation crashes on export. "
        "Requesting an update to the latest version.",
    ),
    (
        "Nitrile Gloves Order (Size M)", "sarah.jenkins@lab.local",
        "Teaching Lab PPE Station", "reject", "low", "2026-10-26", 1, None,
        "Requesting ten boxes of size M nitrile gloves for the teaching lab.",
    ),
    (
        "Cold Room Temperature Alarm", "definate@lab.local", "Cold Room",
        "pending", "medium", "2026-10-29", 2, None,
        "The cold room alarm has triggered twice overnight. The display reads 6°C against a 4°C setpoint.",
    ),
    # Past borrows so equipment usage history has more than one row
    (
        "Confocal Imaging — Cell Culture Samples", "member@lab.local", "Confocal Microscope",
        "close", "low", "2026-10-20", 1, "Jane Manager",
        "Need two hours on the confocal microscope to image fixed cell culture samples.",
    ),
    (
        "Centrifuge Calibration Check", "sarah.jenkins@lab.local", "Centrifuge - Lab 4B",
        "close", "medium", "2026-10-18", 1, None,
        "Routine speed calibration check before the maintenance window.",
    ),
]


def run():
    created = 0
    delete_table(Request)
    for i, (title, email, equipment_name, state, priority, deadline, capacity, approved_by, details) in enumerate(ROWS):
        user = get_one(User, Email=email)
        equipment = get_one(Equipment, EquipmentName=equipment_name)
        request, new = get_or_create(
            Request,
            {"RequestTitle": title},
            UserID=user.UserID,
            EquipmentID=equipment.EquipmentID,
            RequestState=state,
            RequestPriority=priority,
            RequestDeadline=dt(deadline),
            AprovedBy=approved_by,
            RequestDetails=details,
            Capacity=capacity,
            # Staggered 2-8 days back so "time passed" on the dashboard means something
            CreatedAt=days_from_now(-(i + 2)),
        )
        # Refresh existing demo requests too when this seeder is rerun.
        request.Capacity = capacity
        # A seeded closed request needs a completion timestamp for dashboard stats.
        if state == "close" and request.CompletedAt is None:
            request.CompletedAt = datetime.utcnow()
        created += new
    return created
