from extensions import db
from . import users, equipment, requests

SEEDERS = [users, equipment, requests]

def init_app(app):
    @app.cli.command("seed")
    def seed():
        for seeder in SEEDERS:
            print(f"{seeder.__name__.split('.')[-1]}: {seeder.run()} created")
        db.session.commit()  # One commit : Everything pass or nothing