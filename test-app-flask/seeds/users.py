from models import User
from .base import get_or_create

ROWS = [
    ("admin@lab.local",   "John Admin",   "admin",       "Kasetsart University", "admin123"),
    ("manager@lab.local", "Jane Manager", "lab_manager", "Kasetsart University", "manager123"),
    ("ta@lab.local",      "Bob TA",       "lab_ta",      "Kasetsart University", "ta123"),
    ("member@lab.local",  "Alice Member", "lab_member",  "Kasetsart University", "member123"),
    ("guest@lab.local",   "Guest User",   "visitor",     None,                   "guest123"),
    ("mike.chen@lab.local",     "Mike Chen",     "lab_manager", "Kasetsart University", "mike123"),
    ("sarah.jenkins@lab.local", "Sarah Jenkins", "lab_ta",      "Kasetsart University", "sarah123"),
    ("definate@lab.local",      "Definate",      "lab_member",  "Kasetsart University", "definate123"),
]


def run():
    created = 0
    for email, name, role, org, password in ROWS:
        _, new = get_or_create(
            User, {"Email": email},
            UserName=name,
            UserRole=role,
            UserOrganization=org,
            PasswordHash=password,  # Need to do password hash
        )
        created += new
    return created