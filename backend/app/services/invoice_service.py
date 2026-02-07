from decimal import Decimal
from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.invoice import Invoice, InvoiceLine
from app.models.subscription import Subscription, SubscriptionLine
from app.models.tax import Tax
from app.enums import InvoiceStatus, SubscriptionStatus
from app.utils.sequence import generate_sequence


def generate_invoice(db: Session, subscription_id: int) -> Invoice:
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if sub.status not in [SubscriptionStatus.ACTIVE, SubscriptionStatus.CONFIRMED]:
        raise HTTPException(status_code=400, detail="Subscription must be ACTIVE or CONFIRMED to generate invoice")

    invoice_number = generate_sequence(db, Invoice, "INV", "invoice_number")
    invoice = Invoice(
        invoice_number=invoice_number,
        subscription_id=sub.id,
        customer_id=sub.customer_id,
        issue_date=date.today(),
        due_date=None,
        status=InvoiceStatus.DRAFT,
        subtotal=Decimal("0"),
        tax_total=Decimal("0"),
        discount_total=Decimal("0"),
        total=Decimal("0"),
    )
    db.add(invoice)
    db.flush()

    subtotal = Decimal("0")
    tax_total = Decimal("0")
    discount_total = Decimal("0")

    sub_lines = db.query(SubscriptionLine).filter(
        SubscriptionLine.subscription_id == sub.id
    ).all()

    for sl in sub_lines:
        line_subtotal = Decimal(str(sl.quantity)) * sl.unit_price
        tax_amount = Decimal("0")

        if sl.tax_id:
            tax = db.query(Tax).filter(Tax.id == sl.tax_id).first()
            if tax:
                tax_amount = line_subtotal * tax.rate / Decimal("100")

        line_total = line_subtotal + tax_amount

        inv_line = InvoiceLine(
            invoice_id=invoice.id,
            product_id=sl.product_id,
            description=None,
            quantity=sl.quantity,
            unit_price=sl.unit_price,
            tax_id=sl.tax_id,
            tax_amount=tax_amount,
            discount_amount=Decimal("0"),
            line_total=line_total,
        )
        db.add(inv_line)

        subtotal += line_subtotal
        tax_total += tax_amount

    invoice.subtotal = subtotal
    invoice.tax_total = tax_total
    invoice.discount_total = discount_total
    invoice.total = subtotal + tax_total - discount_total

    db.commit()
    db.refresh(invoice)
    return invoice


def get_invoices(
    db: Session, skip: int = 0, limit: int = 100,
    status_filter: str | None = None, customer_id: int | None = None,
) -> list[Invoice]:
    query = db.query(Invoice)
    if status_filter:
        query = query.filter(Invoice.status == status_filter)
    if customer_id:
        query = query.filter(Invoice.customer_id == customer_id)
    return query.offset(skip).limit(limit).all()


def get_invoice(db: Session, invoice_id: int) -> Invoice:
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


def confirm_invoice(db: Session, invoice_id: int) -> Invoice:
    invoice = get_invoice(db, invoice_id)
    if invoice.status != InvoiceStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only DRAFT invoices can be confirmed")
    invoice.status = InvoiceStatus.CONFIRMED
    db.commit()
    db.refresh(invoice)
    return invoice


def cancel_invoice(db: Session, invoice_id: int) -> Invoice:
    invoice = get_invoice(db, invoice_id)
    if invoice.status not in [InvoiceStatus.DRAFT, InvoiceStatus.CONFIRMED]:
        raise HTTPException(status_code=400, detail="Only DRAFT or CONFIRMED invoices can be cancelled")
    invoice.status = InvoiceStatus.CANCELLED
    db.commit()
    db.refresh(invoice)
    return invoice


def send_invoice(db: Session, invoice_id: int) -> dict:
    invoice = get_invoice(db, invoice_id)
    return {"message": f"Invoice {invoice.invoice_number} marked as sent"}


def back_to_draft(db: Session, invoice_id: int) -> Invoice:
    invoice = get_invoice(db, invoice_id)
    if invoice.status != InvoiceStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Only CANCELLED invoices can be set back to draft")
    invoice.status = InvoiceStatus.DRAFT
    db.commit()
    db.refresh(invoice)
    return invoice
