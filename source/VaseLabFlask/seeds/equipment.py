from models import Equipment
from .base import get_or_create, delete_table

ROWS = [
    # (name, model, state, description)
    ("Centrifuge - Lab 4B",         None, "maintenance", "Benchtop centrifuge, rotor assembly serviced Oct 2023."),
    ("Solvent Cabinet",             None, "available",   "Flammable solvent storage (ethanol, acetone)."),
    ("Fume Hood - Lab 2A",          None, "available",   "Chemical fume hood, annual airflow certification required."),
    ("Access Control - Labs 2A/4B", None, "available",   "Keycard readers for Labs 2A and 4B."),
    ("Confocal Microscope",         None, "in_use",      "Confocal microscope with imaging workstation."),
    ("Teaching Lab PPE Station",    None, "available",   "Gloves, goggles and lab coats for the teaching lab."),
    ("Cold Room",                   None, "available",   "Walk-in cold room, 4°C setpoint."),
]


def run():
    created = 0
    delete_table(Equipment)
    for name, model, state, description in ROWS:
        item, new = get_or_create(
            Equipment, {"EquipmentName": name},
            EquipmentModel=model,
            EquipmentState=state,
            EquipmentDescription=description,
        )
        # Refresh existing demo equipment too when this seeder is rerun.
        item.EquipmentState = state
        created += new
    return created