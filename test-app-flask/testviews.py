from flask import Blueprint
import mysql.connector

test_pages = Blueprint("test_pages", __name__)

url = "mysql-db"

@test_pages.route("/")
def test_page():
    cnx = mysql.connector.connect(user="root", password="abc", database="Test", host=url)
    cursor = cnx.cursor()
    query = "SELECT * FROM Users"
    cursor.execute(query)
    return {"message": str(list(cursor))}