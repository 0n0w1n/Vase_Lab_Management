import os
from flask import Flask
from testviews import test_pages
from extensions import db, migrate # Import ORM and Migration Instances


def create_app(test_config=None):
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY="dev",
        SQLALCHEMY_DATABASE_URI=os.environ["DATABASE_URL"],  # Adress that is going to read init_app
        SQLALCHEMY_TRACK_MODIFICATIONS=False, # Disable modification tracker
    )

    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile("config.py", silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    os.makedirs(app.instance_path, exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)

    from models import User

    app.register_blueprint(test_pages, url_prefix="/test")

    @app.cli.command("seed")
    def seed():
        rows = [
            ("admin", "John", "Admin"),
            ("awsfgdj", "John", "NotAdmin"),
        ]

        for username, first, last in rows:
            if db.session.get(Users, username) is None:
                db.session.add(
                    Users(Username=username, FirstName=first, LastName=last)
                )

        db.session.commit()
        print(f"{len(rows)} users seeded")
    return app