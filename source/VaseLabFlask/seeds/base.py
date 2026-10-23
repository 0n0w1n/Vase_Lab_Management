from datetime import datetime
from extensions import db
from sqlalchemy import delete

def delete_table(table):
    db.session.execute(delete(table))

def get_or_create(model, lookup, **fields):
    obj = model(**lookup, **fields)
    db.session.add(obj)
    return obj, True

def get_one(model, **lookup):
    return db.session.execute(db.select(model).filter_by(**lookup)).scalar_one()

def dt(value):
    return datetime.fromisoformat(value.replace("Z", ""))