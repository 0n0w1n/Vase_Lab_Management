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

class Equipment(db.Model):
    __tablename__ = "Equipment"

    EquipmentID = db.Column(db.Integer, primary_key=True)
    EquipmentName = db.Column(db.String(140), nullable=False)
    EquipmentModel = db.Column(db.String(140))
    EquipmentState = db.Column(
        db.Enum("available", "in_use", "maintenance", "retired", name="equipment_state"),
        nullable=False,
        default="available",
    )
    EquipmentType = db.Column(
        db.Enum("Usable" , "Unusable" , name="equipment_type"), # To finish enum , I need your values for this one
        nullable=False,
    )
    EquipmentDescription = db.Column(db.Text)
    ReturnAt = db.Column(db.String(140))
    CreatedAt = db.Column(db.DateTime, server_default=db.func.now())
    UpdatedAt = db.Column(
        db.DateTime, server_default=db.func.now(), onupdate=datetime.utcnow
    )


class Request(db.Model):
    __tablename__ = "Request"

    RequestID = db.Column(db.Integer, primary_key=True)
    RequestTitle = db.Column(db.String(255), nullable=False)
    RequestDetails = db.Column(db.Text)
    RequestState = db.Column(
        db.Enum("pending", "approved", "rejected", "returned", name="request_state"),
        nullable=False,
        default="pending",
    )
    AprovedBy = db.Column(db.String(255))
    RequestPriority = db.Column(
        db.Enum("low", "medium", "high", name="request_priority"),
        nullable=False,
        default="medium",
    )
    RequestDeadline = db.Column(db.DateTime)

    UserID = db.Column(db.Integer, db.ForeignKey("Users.UserID"), nullable=False)
    EquipmentID = db.Column(
        db.Integer, db.ForeignKey("Equipment.EquipmentID"), nullable=True
    )


class Comment(db.Model):
    __tablename__ = "Comments"

    CommentID = db.Column(db.Integer, primary_key=True)
    CommentText = db.Column(db.Text, nullable=False)

    UserID = db.Column(db.Integer, db.ForeignKey("Users.UserID"), nullable=False)
    RequestID = db.Column(db.Integer, db.ForeignKey("Request.RequestID"), nullable=False)

    CreatedAt = db.Column(db.DateTime, server_default=db.func.now())
    UpdatedAt = db.Column(
        db.DateTime, server_default=db.func.now(), onupdate=datetime.utcnow
    )


class File(db.Model):
    __tablename__ = "Files"

    FileID = db.Column(db.Integer, primary_key=True)
    FileName = db.Column(db.String(100), nullable=False)
    FilePath = db.Column(db.String(512), nullable=True)

    RequestID = db.Column(db.Integer, db.ForeignKey("Request.RequestID"), nullable=False)
    UserID = db.Column(db.Integer, db.ForeignKey("Users.UserID"), nullable=False)

    FileSize = db.Column(db.Integer)
    FileType = db.Column(db.String(100))
    CreatedAt = db.Column(db.DateTime, server_default=db.func.now())
    UpdatedAt = db.Column(
        db.DateTime, server_default=db.func.now(), onupdate=datetime.utcnow
    )


class ActivityLog(db.Model):
    __tablename__ = "Activity_log"

    LogID = db.Column(db.Integer, primary_key=True)
    UserID = db.Column(db.Integer, db.ForeignKey("Users.UserID"), nullable=False)
    Action = db.Column(
        db.Enum("create", "update", "delete", name="log_action"), nullable=False
    )
    EntityType = db.Column(
        db.Enum("request", "equipment", "user", "file", "comment", name="log_entity"),
        nullable=False,
    )
    EntityID = db.Column(db.Integer, nullable=False, index=True)
    OldValue = db.Column(db.JSON)
    NewValue = db.Column(db.JSON)
    CreatedAt = db.Column(db.DateTime, server_default=db.func.now())