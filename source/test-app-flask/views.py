from flask import Blueprint
from extensions import db
from models import *


test_pages = Blueprint("test_pages", __name__)

url = "mysql-db"

@test_pages.route("/requests_list")
def get_requests_list():
    requests: list[Request] = db.session.execute(db.select(Request)).scalars()
    result = []
    for request in requests:
        result.append({
            "id": request.RequestID,
            "title": request.RequestTitle,
            "status": request.RequestState,
            "priority": request.RequestPriority,
            "deadline": request.RequestDeadline,
        })

    return {"message": result}