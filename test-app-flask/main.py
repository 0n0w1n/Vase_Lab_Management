import os
from flask import Flask
from testviews import test_pages
from extensions import db, migrate # Import ORM and Migration Instances


def create_app(test_config=None):
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY="dev",
        SQLALCHEMY_DATABASE_URI=os.environ["DATABASE_URL"],
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
            ("admin@lab.local",   "John Admin",    "admin",       "Kasetsart University", "admin123"),
            ("manager@lab.local", "Jane Manager",  "lab_manager", "Kasetsart University", "manager123"),
            ("ta@lab.local",      "Bob TA",        "lab_ta",      "Kasetsart University", "ta123"),
            ("member@lab.local",  "Alice Member",  "lab_member",  "Kasetsart University", "member123"),
            ("guest@lab.local",   "Guest User",    "visitor",     None,                   "guest123"),
        ]

        created = 0
        
        for email, name, role, org, password in rows:
            exists = db.session.execute(                
                db.select(User).filter_by(Email=email)
            ).scalar_one_or_none()

            if exists is None:
                    db.session.add(
                        User(
                            Email=email,
                            UserName=name,
                            UserRole=role,
                            UserOrganization=org,
                            PasswordHash=password, # Will need a way to hash later /!\  
                        )
                    )
                    created += 1

        db.session.commit()
        print(f"{created} users seeded ({len(rows) - created} already existed)")
    return app