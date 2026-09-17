import os
from flask import Flask
from requestviews import request_api
from authviews import auth_api
from extensions import db, migrate, jwt
import seeds


def create_app(test_config=None):
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY="dev",
        SQLALCHEMY_DATABASE_URI=os.environ["DATABASE_URL"],
        SQLALCHEMY_TRACK_MODIFICATIONS=False, # Disable modification tracker
        JWT_SECRET_KEY="dev",
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
    jwt.init_app(app)


    app.register_blueprint(request_api, url_prefix="/requests")
    app.register_blueprint(auth_api, url_prefix="/auth")

    seeds.init_app(app)
    return app