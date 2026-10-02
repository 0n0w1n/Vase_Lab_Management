from flask import Blueprint, request
from extensions import db
from flask_jwt_extended import jwt_required, current_user
from models import *
from datetime import date, datetime

user_api = Blueprint("user_api", __name__)

current_user: User

@user_api.get("/current")
@jwt_required()
def me():
    user = current_user
    return {
        "id": str(user.UserID),
        "name": user.UserFullName,
        "email": user.Email,
        "role": user.UserRole,
        "organization": user.UserOrganization,
        "createdAt": user.CreatedAt
    }