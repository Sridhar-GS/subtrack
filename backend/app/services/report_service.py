from decimal import Decimal
from datetime import date

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.subscription import Subscription
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.enums import SubscriptionStatus, InvoiceStatus


def get_active_subscriptions(db: Session) -> dict:
    query = db.query(Subscription).filter(Subscription.status == SubscriptionStatus.ACTIVE)
    total = query.count()
    subs = query.all()
    return {
        "total_active": total,
        "subscriptions": [
            {
                "id": s.id,
                "subscription_number": s.subscription_number,
                "customer_id": s.customer_id,
                "plan_id": s.plan_id,
                "start_date": str(s.start_date),
                "status": s.status.value,
            }
            for s in subs
        ],
    }


def get_revenue(db: Session, start_date: date | None = None, end_date: date | None = None) -> dict:
    query = db.query(func.sum(Invoice.total)).filter(Invoice.status == InvoiceStatus.PAID)
    if start_date:
        query = query.filter(Invoice.issue_date >= start_date)
    if end_date:
        query = query.filter(Invoice.issue_date <= end_date)
    total = query.scalar() or Decimal("0")
    return {
        "total_revenue": total,
        "period_start": str(start_date) if start_date else None,
        "period_end": str(end_date) if end_date else None,
    }


def get_payments_summary(db: Session, start_date: date | None = None, end_date: date | None = None) -> dict:
    query = db.query(Payment)
    if start_date:
        query = query.filter(Payment.payment_date >= start_date)
    if end_date:
        query = query.filter(Payment.payment_date <= end_date)

    total_amount = db.query(func.sum(Payment.amount))
    total_count = db.query(func.count(Payment.id))
    if start_date:
        total_amount = total_amount.filter(Payment.payment_date >= start_date)
        total_count = total_count.filter(Payment.payment_date >= start_date)
    if end_date:
        total_amount = total_amount.filter(Payment.payment_date <= end_date)
        total_count = total_count.filter(Payment.payment_date <= end_date)

    by_method_query = db.query(
        Payment.payment_method,
        func.sum(Payment.amount).label("total"),
        func.count(Payment.id).label("count"),
    )
    if start_date:
        by_method_query = by_method_query.filter(Payment.payment_date >= start_date)
    if end_date:
        by_method_query = by_method_query.filter(Payment.payment_date <= end_date)
    by_method = by_method_query.group_by(Payment.payment_method).all()

    return {
        "total_payments": total_amount.scalar() or Decimal("0"),
        "payment_count": total_count.scalar() or 0,
        "by_method": [
            {"method": m.payment_method, "total": m.total, "count": m.count}
            for m in by_method
        ],
    }


def get_overdue_invoices(db: Session) -> dict:
    today = date.today()
    query = db.query(Invoice).filter(
        Invoice.status == InvoiceStatus.CONFIRMED,
        Invoice.due_date != None,
        Invoice.due_date < today,
    )
    total = query.count()
    total_amount = db.query(func.sum(Invoice.total)).filter(
        Invoice.status == InvoiceStatus.CONFIRMED,
        Invoice.due_date != None,
        Invoice.due_date < today,
    ).scalar() or Decimal("0")
    invoices = query.all()
    return {
        "total_overdue": total,
        "total_amount": total_amount,
        "invoices": [
            {
                "id": i.id,
                "invoice_number": i.invoice_number,
                "customer_id": i.customer_id,
                "total": i.total,
                "due_date": str(i.due_date),
            }
            for i in invoices
        ],
    }
