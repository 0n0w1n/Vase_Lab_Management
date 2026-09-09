from flask import Blueprint
from extensions import db
from models import User
import mysql.connector

test_pages = Blueprint("test_pages", __name__)

url = "mysql-db"

@test_pages.route("/")
def test_page():
    return {"message": str(list(db.session.execute(db.select(User)).all()))}