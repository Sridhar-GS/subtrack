from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.payment import Payment
from app.models.invoice import Invoice
from app.schemas.payment import PaymentCreate
from app.enums import InvoiceStatus


def create_payment(db: Session, data: PaymentCreate, user_id: int) -> Payment:
    invoice = db.query(Invoice).filter(Invoice.id == data.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.status != InvoiceStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail="Can only pay CONFIRMED invoices")

    payment = Payment(
        invoice_id=data.invoice_id,
        user_id=user_id,
        payment_method=data.payment_method,
        amount=data.amount,
        payment_date=data.payment_date,
        reference=data.reference,
        notes=data.notes,
    )
    db.add(payment)
    db.flush()

    total_paid = db.query(func.sum(Payment.amount)).filter(
        Payment.invoice_id == data.invoice_id
    ).scalar() or Decimal("0")

    if total_paid >= invoice.total:
        invoice.status = InvoiceStatus.PAID

    db.commit()
    db.refresh(payment)
    return payment


def get_payments(
    db: Session, skip: int = 0, limit: int = 100,
    invoice_id: int | None = None, customer_id: int | None = None,
) -> list[Payment]:
    query = db.query(Payment)
    if invoice_id:
        query = query.filter(Payment.invoice_id == invoice_id)
    if customer_id:
        query = query.filter(Payment.user_id == customer_id)
    return query.offset(skip).limit(limit).all()


def get_payment(db: Session, payment_id: int) -> Payment:
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment
