from datetime import datetime, timedelta
from extensions import db
from sqlalchemy import delete

def delete_table(table):
    # db.session.execute(delete(table))
    pass

def get_or_create(model, lookup, **fields):
    obj = db.session.execute(db.select(model).filter_by(**lookup)).scalar_one_or_none()
    if obj is not None:
        return obj, False
    obj = model(**lookup, **fields)
    db.session.add(obj)
    return obj, True

def get_one(model, **lookup):
    return db.session.execute(db.select(model).filter_by(**lookup)).scalar_one()

def dt(value):
    return datetime.fromisoformat(value.replace("Z", ""))

def days_from_now(days, hours=0):
    """Relative to seeding time, so demo timestamps don't go stale. Negative = in the past."""
    return datetime.utcnow() + timedelta(days=days, hours=hours)