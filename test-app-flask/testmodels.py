from extensions import db


class User(db.Model):
    __tablename__ = "Users"

    Username = db.Column(db.String(100), primary_key=True)
    FirstName = db.Column(db.String(100))
    LastName = db.Column(db.String(100))