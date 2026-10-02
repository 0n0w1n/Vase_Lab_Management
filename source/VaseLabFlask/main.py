import os
from datetime import timedelta
from flask import Flask
from extensions import db, migrate, jwt
import seeds

from views.requestviews import request_api
from views.authviews import auth_api
from views.userviews import user_api

def create_app(test_config=None):
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY=os.environ["SECRET_KEY"],
        SQLALCHEMY_DATABASE_URI=os.environ["DATABASE_URL"],
        SQLALCHEMY_TRACK_MODIFICATIONS=False, # Disable modification tracker
        JWT_SECRET_KEY=os.environ["JWT_SECRET_KEY"],
        JWT_ACCESS_TOKEN_EXPIRES=timedelta(hours=3), # Default is 15 min; no refresh tokens yet
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


    app.register_blueprint(request_api, url_prefix="/request")
    app.register_blueprint(auth_api, url_prefix="/auth")
    app.register_blueprint(user_api, url_prefix="/user")

    seeds.init_app(app)
    return app