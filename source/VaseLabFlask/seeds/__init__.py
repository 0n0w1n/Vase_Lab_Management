import os

from VaseLabFlask.extensions import db
from VaseLabFlask.lib.authUtils import hash_password
from VaseLabFlask.models import User
from . import users, equipment, requests, assignments, equipment_activity

SEEDERS = [users, equipment, requests, assignments, equipment_activity]

def init_app(app):
    @app.cli.command("seed")
    def seed():
        for seeder in SEEDERS:
            print(f"{seeder.__name__.split('.')[-1]}: {seeder.run()} created")
        db.session.commit()  # One commit : Everything pass or nothing

    @app.cli.command("create-admin")
    def create_admin():
        """Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD; does nothing if one exists."""
        if db.session.scalar(db.select(User)):
            print("User already exists, skipping")
            return
        db.session.add(User(
            Email=os.environ["ADMIN_EMAIL"],
            UserFullName=os.environ.get("ADMIN_NAME", "Administrator"),
            UserRole="admin",
            PasswordHash=hash_password(os.environ["ADMIN_PASSWORD"]),
        ))
        db.session.commit()
        print("Admin created")