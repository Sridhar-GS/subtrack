from sqlalchemy.orm import Session
from sqlalchemy import func


def generate_sequence(db: Session, model_class, prefix: str, number_field: str) -> str:
    last = db.query(func.max(getattr(model_class, number_field))).scalar()
    if last is None:
        return f"{prefix}-0001"
    num = int(last.split("-")[1]) + 1
    return f"{prefix}-{num:04d}"
