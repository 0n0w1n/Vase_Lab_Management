from models import Equipment
from .base import get_or_create

ROWS = [
    # (name, model, type, state, description)
    ("Centrifuge - Lab 4B",         None, "Unusable", "maintenance", "Benchtop centrifuge, rotor assembly serviced Oct 2023."),
    ("Solvent Cabinet",             None, "Usable",   "available",   "Flammable solvent storage (ethanol, acetone)."),
    ("Fume Hood - Lab 2A",          None, "Usable",   "available",   "Chemical fume hood, annual airflow certification required."),
    ("Access Control - Labs 2A/4B", None, "Usable",   "available",   "Keycard readers for Labs 2A and 4B."),
    ("Confocal Microscope",         None, "Usable",   "available",   "Confocal microscope with imaging workstation."),
    ("Teaching Lab PPE Station",    None, "Usable",   "available",   "Gloves, goggles and lab coats for the teaching lab."),
    ("Cold Room",                   None, "Usable",   "available",   "Walk-in cold room, 4°C setpoint."),
]


def run():
    created = 0
    for name, model, type_, state, description in ROWS:
        _, new = get_or_create(
            Equipment, {"EquipmentName": name},
            EquipmentModel=model,
            EquipmentType=type_,
            EquipmentState=state,
            EquipmentDescription=description,
        )
        created += new
    return created