from extensions import db
from datetime import datetime


class User(db.Model):
    __tablename__ = "Users"

    UserID = db.Column(db.Integer, primary_key=True)
    UserName = db.Column(db.String(255), nullable=False)
    Email = db.Column(db.String(254), unique=True, nullable=False)
    PasswordHash = db.Column(db.String(254), nullable=False)
    UserRole = db.Column(
        db.Enum("admin", "lab_manager", "lab_ta", "lab_member","visitor", name="user_role"),
        nullable=False,
        default="visitor",
    )
    UserOrganization = db.Column(db.String(150))
    CreatedAt = db.Column(db.DateTime, server_default=db.func.now())
    UpdatedAt = db.Column(
        db.DateTime, server_default=db.func.now(), onupdate=datetime.utcnow
    )
