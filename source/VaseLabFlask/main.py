import os
from datetime import timedelta
from pathlib import Path

from flask import Flask, request
from werkzeug.exceptions import HTTPException

from extensions import db, migrate, jwt
import seeds

from views.requestviews import request_api
from views.authviews import auth_api
from views.userviews import user_api
from views.dashboardviews import dashboard_api
from views.equipmentviews import equipment_api
from views.workloadviews import workload_api
from views.fileviews import file_api

def create_app(test_config=None):
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY=os.environ["SECRET_KEY"],
        SQLALCHEMY_DATABASE_URI=os.environ["DATABASE_URL"],
        SQLALCHEMY_TRACK_MODIFICATIONS=False, # Disable modification tracker
        JWT_SECRET_KEY=os.environ["JWT_SECRET_KEY"],
        JWT_ACCESS_TOKEN_EXPIRES=timedelta(hours=3), # Default is 15 min; no refresh tokens yet
        UPLOAD_ROOT=os.environ.get( # Fetch environment variable UPLOAD_ROOT
            "UPLOAD_ROOT",
            os.path.join(app.instance_path, "uploads"),
        ),
        MAX_FILE_BYTES=10 * 1024 * 1024,
        MAX_CONTENT_LENGTH=11 * 1024 * 1024,
    )

    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile("config.py", silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    upload_root = Path(app.config["UPLOAD_ROOT"])
    upload_root.mkdir(parents=True, exist_ok=True, mode=0o700)

    (upload_root / ".tmp").mkdir(exist_ok=True, mode=0o700)
    # ensure the instance folder exists
    os.makedirs(app.instance_path, exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)


    app.register_blueprint(request_api, url_prefix="/request")
    app.register_blueprint(auth_api, url_prefix="/auth")
    app.register_blueprint(user_api, url_prefix="/user")
    app.register_blueprint(dashboard_api, url_prefix="/dashboard")
    app.register_blueprint(equipment_api, url_prefix="/equipment")
    app.register_blueprint(workload_api, url_prefix="/dashboard/workload")
    app.register_blueprint(file_api, url_prefix="/file")

    @app.errorhandler(HTTPException)
    def handle_file_http_error(error):
        """Keep routing/parser errors JSON only for the new file API."""
        if request.path != "/file" and not request.path.startswith("/file/"):
            return error

        codes = {400: "19", 404: "13", 405: "14", 413: "32", 415: "20"}
        response = error.get_response()
        response.set_data(app.json.dumps({
            "errorCode": codes.get(error.code, "40"),
            "error": error.name,
        }))
        response.mimetype = "application/json"
        response.headers["Cache-Control"] = "private, no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    seeds.init_app(app)
    return app