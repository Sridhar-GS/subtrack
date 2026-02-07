from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.recurring_plan import RecurringPlan
from app.schemas.recurring_plan import RecurringPlanCreate, RecurringPlanUpdate


def create_plan(db: Session, data: RecurringPlanCreate) -> RecurringPlan:
    plan = RecurringPlan(
        name=data.name,
        price=data.price,
        billing_period=data.billing_period,
        min_quantity=data.min_quantity,
        start_date=data.start_date,
        end_date=data.end_date,
        auto_close=data.auto_close,
        closable=data.closable,
        pausable=data.pausable,
        renewable=data.renewable,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def get_plans(db: Session, skip: int = 0, limit: int = 100) -> list[RecurringPlan]:
    return db.query(RecurringPlan).offset(skip).limit(limit).all()


def get_plan(db: Session, plan_id: int) -> RecurringPlan:
    plan = db.query(RecurringPlan).filter(RecurringPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Recurring plan not found")
    return plan


def update_plan(db: Session, plan_id: int, data: RecurringPlanUpdate) -> RecurringPlan:
    plan = get_plan(db, plan_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plan, field, value)
    db.commit()
    db.refresh(plan)
    return plan


def delete_plan(db: Session, plan_id: int):
    plan = get_plan(db, plan_id)
    db.delete(plan)
    db.commit()
