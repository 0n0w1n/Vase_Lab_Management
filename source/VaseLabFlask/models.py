from datetime import datetime
from typing import Any

from sqlalchemy.orm import mapped_column
from extensions import db


class User(db.Model):
    __tablename__ = "Users"
    __allow_unmapped__ = True

    UserID: int = mapped_column(db.Integer, primary_key=True)
    UserFullName: str = mapped_column(db.String(255), nullable=False)
    Email: str = mapped_column(db.String(254), unique=True, nullable=False)
    PasswordHash: str = mapped_column(db.String(254), nullable=False)
    UserRole: str = mapped_column(
        db.Enum(
            "admin",
            "lab_manager",
            "lab_ta",
            "lab_member",
            "visitor",
            name="user_role",
        ),
        nullable=False,
        default="visitor",
    )
    UserOrganization: str | None = mapped_column(db.String(150))
    CreatedAt: datetime | None = mapped_column(
        db.DateTime, server_default=db.func.now()
    )
    UpdatedAt: datetime | None = mapped_column(
        db.DateTime, server_default=db.func.now(), onupdate=datetime.utcnow
    )


class Equipment(db.Model):
    __tablename__ = "Equipment"
    __allow_unmapped__ = True

    EquipmentID: int = mapped_column(db.Integer, primary_key=True)
    EquipmentName: str = mapped_column(db.String(140), nullable=False)
    EquipmentModel: str | None = mapped_column(db.String(140))
    EquipmentState: str = mapped_column(
        db.Enum(
            "available",
            "in_use",
            "maintenance",
            "retired",
            name="equipment_state",
        ),
        nullable=False,
        default="available",
    )
    EquipmentType: str = mapped_column(
        db.Enum("Usable", "Unusable", name="equipment_type"),
        nullable=False,
    )
    EquipmentDescription: str | None = mapped_column(db.Text)
    ReturnAt: str | None = mapped_column(db.String(140))
    CreatedAt: datetime | None = mapped_column(
        db.DateTime, server_default=db.func.now()
    )
    UpdatedAt: datetime | None = mapped_column(
        db.DateTime, server_default=db.func.now(), onupdate=datetime.utcnow
    )


class Request(db.Model):
    __tablename__ = "Request"
    __allow_unmapped__ = True

    RequestID: int = mapped_column(db.Integer, primary_key=True)
    RequestTitle: str = mapped_column(db.String(255), nullable=False)
    RequestDetails: str | None = mapped_column(db.Text)
    RequestState: str = mapped_column(
        db.Enum(
            "pending",
            "in-progress",
            "review",
            "close",
            "reject",
            name="request_state",
        ),
        nullable=False,
        default="pending",
    )
    AprovedBy: str | None = mapped_column(db.String(255))
    RequestPriority: str = mapped_column(
        db.Enum("low", "medium", "high", name="request_priority"),
        nullable=False,
        default="medium",
    )
    RequestDeadline: datetime | None = mapped_column(db.DateTime)
    Capacity: int = mapped_column(
        db.Integer, nullable=False, default=1, server_default="1"
    )

    UserID: int = mapped_column(
        db.Integer, db.ForeignKey("Users.UserID"), nullable=False
    )
    EquipmentID: int | None = mapped_column(
        db.Integer, db.ForeignKey("Equipment.EquipmentID"), nullable=True
    )

    @property
    def AssignedCount(self) -> int:
        return RequestAssignment.query.filter_by(
            RequestID=self.RequestID,
            State="Approved",
        ).count()


class Comment(db.Model):
    __tablename__ = "Comments"
    __allow_unmapped__ = True

    CommentID: int = mapped_column(db.Integer, primary_key=True)
    CommentText: str = mapped_column(db.Text, nullable=False)
    UserID: int = mapped_column(
        db.Integer, db.ForeignKey("Users.UserID"), nullable=False
    )
    RequestID: int = mapped_column(
        db.Integer, db.ForeignKey("Request.RequestID"), nullable=False
    )
    CreatedAt: datetime | None = mapped_column(
        db.DateTime, server_default=db.func.now()
    )
    UpdatedAt: datetime | None = mapped_column(
        db.DateTime, server_default=db.func.now(), onupdate=datetime.utcnow
    )


class File(db.Model):
    __tablename__ = "Files"
    __allow_unmapped__ = True

    FileID: int = mapped_column(db.Integer, primary_key=True)
    FileName: str = mapped_column(db.String(100), nullable=False)
    FilePath: str | None = mapped_column(db.String(512), nullable=True)
    RequestID: int = mapped_column(
        db.Integer, db.ForeignKey("Request.RequestID"), nullable=False
    )
    UserID: int = mapped_column(
        db.Integer, db.ForeignKey("Users.UserID"), nullable=False
    )
    FileSize: int | None = mapped_column(db.Integer)
    FileType: str | None = mapped_column(db.String(100))
    CreatedAt: datetime | None = mapped_column(
        db.DateTime, server_default=db.func.now()
    )
    UpdatedAt: datetime | None = mapped_column(
        db.DateTime, server_default=db.func.now(), onupdate=datetime.utcnow
    )


class ActivityLog(db.Model):
    __tablename__ = "Activity_log"
    __allow_unmapped__ = True

    LogID: int = mapped_column(db.Integer, primary_key=True)
    UserID: int = mapped_column(
        db.Integer, db.ForeignKey("Users.UserID"), nullable=False
    )
    Action: str = mapped_column(
        db.Enum("create", "update", "delete", name="log_action"),
        nullable=False,
    )
    EntityType: str = mapped_column(
        db.Enum(
            "request",
            "equipment",
            "user",
            "file",
            "comment",
            name="log_entity",
        ),
        nullable=False,
    )
    EntityID: int = mapped_column(db.Integer, nullable=False, index=True)
    OldValue: Any | None = mapped_column(db.JSON)
    NewValue: Any | None = mapped_column(db.JSON)
    CreatedAt: datetime | None = mapped_column(
        db.DateTime, server_default=db.func.now()
    )


class RequestAssignment(db.Model):
    __tablename__ = "RequestAssignment"
    __allow_unmapped__ = True

    RequestID: int = mapped_column(
        db.Integer, db.ForeignKey("Request.RequestID"), primary_key=True
    )
    UserID: int = mapped_column(
        db.Integer, db.ForeignKey("Users.UserID"), primary_key=True
    )
    Message: str | None = mapped_column(db.Text)
    State: str = mapped_column(
        db.Enum("Waiting", "Refused", "Approved", name="assignment_state"),
        nullable=False,
        default="Waiting",
        server_default="Waiting",
    )
    CreatedAt: datetime = mapped_column(
        db.DateTime, nullable=False, server_default=db.func.now()
    )
    DecidedAt: datetime | None = mapped_column(db.DateTime, nullable=True)
    UpdatedAt: datetime | None = mapped_column(
        db.DateTime, server_default=db.func.now(), onupdate=datetime.utcnow
    )
