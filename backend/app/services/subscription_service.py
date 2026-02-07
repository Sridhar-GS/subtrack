from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.subscription import Subscription, SubscriptionLine
from app.models.recurring_plan import RecurringPlan
from app.schemas.subscription import (
    SubscriptionCreate, SubscriptionUpdate,
    SubscriptionLineCreate, SubscriptionLineUpdate,
)
from app.enums import SubscriptionStatus
from app.utils.sequence import generate_sequence


VALID_TRANSITIONS = {
    "to_quotation": (SubscriptionStatus.DRAFT, SubscriptionStatus.QUOTATION),
    "confirm": (SubscriptionStatus.QUOTATION, SubscriptionStatus.CONFIRMED),
    "activate": (SubscriptionStatus.CONFIRMED, SubscriptionStatus.ACTIVE),
    "pause": (SubscriptionStatus.ACTIVE, SubscriptionStatus.PAUSED),
    "resume": (SubscriptionStatus.PAUSED, SubscriptionStatus.ACTIVE),
    "close": (SubscriptionStatus.ACTIVE, SubscriptionStatus.CLOSED),
}


def _compute_line_amount(quantity: int, unit_price: Decimal) -> Decimal:
    return Decimal(str(quantity)) * unit_price


def create_subscription(db: Session, data: SubscriptionCreate) -> Subscription:
    sub_number = generate_sequence(db, Subscription, "SUB", "subscription_number")
    subscription = Subscription(
        subscription_number=sub_number,
        customer_id=data.customer_id,
        plan_id=data.plan_id,
        start_date=data.start_date,
        expiration_date=data.expiration_date,
        payment_terms=data.payment_terms,
        notes=data.notes,
        status=SubscriptionStatus.DRAFT,
    )
    db.add(subscription)
    db.flush()

    for line_data in data.lines:
        amount = _compute_line_amount(line_data.quantity, line_data.unit_price)
        line = SubscriptionLine(
            subscription_id=subscription.id,
            product_id=line_data.product_id,
            quantity=line_data.quantity,
            unit_price=line_data.unit_price,
            tax_id=line_data.tax_id,
            discount_id=line_data.discount_id,
            amount=amount,
        )
        db.add(line)

    db.commit()
    db.refresh(subscription)
    return subscription


def get_subscriptions(
    db: Session, skip: int = 0, limit: int = 100,
    status_filter: str | None = None, customer_id: int | None = None,
) -> list[Subscription]:
    query = db.query(Subscription)
    if status_filter:
        query = query.filter(Subscription.status == status_filter)
    if customer_id:
        query = query.filter(Subscription.customer_id == customer_id)
    return query.offset(skip).limit(limit).all()


def get_subscription(db: Session, sub_id: int) -> Subscription:
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return sub


def update_subscription(db: Session, sub_id: int, data: SubscriptionUpdate) -> Subscription:
    sub = get_subscription(db, sub_id)
    if sub.status not in [SubscriptionStatus.DRAFT, SubscriptionStatus.QUOTATION]:
        raise HTTPException(status_code=400, detail="Can only update subscriptions in DRAFT or QUOTATION status")
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sub, field, value)
    db.commit()
    db.refresh(sub)
    return sub


def delete_subscription(db: Session, sub_id: int):
    sub = get_subscription(db, sub_id)
    if sub.status != SubscriptionStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Can only delete subscriptions in DRAFT status")
    db.delete(sub)
    db.commit()


def add_line(db: Session, sub_id: int, data: SubscriptionLineCreate) -> SubscriptionLine:
    sub = get_subscription(db, sub_id)
    amount = _compute_line_amount(data.quantity, data.unit_price)
    line = SubscriptionLine(
        subscription_id=sub.id,
        product_id=data.product_id,
        quantity=data.quantity,
        unit_price=data.unit_price,
        tax_id=data.tax_id,
        discount_id=data.discount_id,
        amount=amount,
    )
    db.add(line)
    db.commit()
    db.refresh(line)
    return line


def update_line(db: Session, sub_id: int, line_id: int, data: SubscriptionLineUpdate) -> SubscriptionLine:
    line = db.query(SubscriptionLine).filter(
        SubscriptionLine.id == line_id,
        SubscriptionLine.subscription_id == sub_id,
    ).first()
    if not line:
        raise HTTPException(status_code=404, detail="Subscription line not found")
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(line, field, value)
    line.amount = _compute_line_amount(line.quantity, line.unit_price)
    db.commit()
    db.refresh(line)
    return line


def delete_line(db: Session, sub_id: int, line_id: int):
    line = db.query(SubscriptionLine).filter(
        SubscriptionLine.id == line_id,
        SubscriptionLine.subscription_id == sub_id,
    ).first()
    if not line:
        raise HTTPException(status_code=404, detail="Subscription line not found")
    db.delete(line)
    db.commit()


def transition_status(db: Session, sub_id: int, action: str) -> Subscription:
    sub = get_subscription(db, sub_id)

    if action not in VALID_TRANSITIONS:
        raise HTTPException(status_code=400, detail=f"Invalid action: {action}")

    from_status, to_status = VALID_TRANSITIONS[action]
    if sub.status != from_status:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot {action}: subscription is in {sub.status.value} status, expected {from_status.value}",
        )

    plan = db.query(RecurringPlan).filter(RecurringPlan.id == sub.plan_id).first()

    if action == "pause" and plan and not plan.pausable:
        raise HTTPException(status_code=400, detail="This plan does not allow pausing")
    if action == "close" and plan and not plan.closable:
        raise HTTPException(status_code=400, detail="This plan does not allow closing")

    sub.status = to_status
    db.commit()
    db.refresh(sub)
    return sub
