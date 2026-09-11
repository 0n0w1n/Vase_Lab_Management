import os
from flask import Flask
from views import test_pages
from extensions import db, migrate # Import ORM and Migration Instances
import seeds


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


    app.register_blueprint(test_pages, url_prefix="/")

    seeds.init_app(app)
    return app