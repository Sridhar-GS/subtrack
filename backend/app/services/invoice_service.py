from decimal import Decimal
from datetime import date, timedelta
import io

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.invoice import Invoice, InvoiceLine
from app.models.subscription import Subscription, SubscriptionLine
from app.models.payment import Payment
from app.models.tax import Tax
from app.models.discount import Discount
from app.models.user import User
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
        due_date=date.today() + timedelta(days=30),
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

        # Apply discount if present on the subscription line
        line_discount = Decimal("0")
        if sl.discount_id:
            disc = db.query(Discount).filter(Discount.id == sl.discount_id).first()
            if disc and disc.is_active:
                if disc.discount_type.value == "percentage":
                    line_discount = line_subtotal * disc.value / Decimal("100")
                else:
                    line_discount = disc.value
                # Increment usage count
                disc.usage_count = (disc.usage_count or 0) + 1

        discounted_subtotal = line_subtotal - line_discount

        tax_amount = Decimal("0")
        if sl.tax_id:
            tax = db.query(Tax).filter(Tax.id == sl.tax_id).first()
            if tax:
                tax_amount = discounted_subtotal * tax.rate / Decimal("100")

        line_total = discounted_subtotal + tax_amount

        inv_line = InvoiceLine(
            invoice_id=invoice.id,
            product_id=sl.product_id,
            description=None,
            quantity=sl.quantity,
            unit_price=sl.unit_price,
            tax_id=sl.tax_id,
            tax_amount=tax_amount,
            discount_amount=line_discount,
            line_total=line_total,
        )
        db.add(inv_line)

        subtotal += line_subtotal
        tax_total += tax_amount
        discount_total += line_discount

    invoice.subtotal = subtotal
    invoice.tax_total = tax_total
    invoice.discount_total = discount_total
    invoice.total = subtotal - discount_total + tax_total

    # Advance next_invoice_date on the subscription
    if sub.next_invoice_date and sub.plan:
        plan = sub.plan
        period = plan.billing_period.value if hasattr(plan.billing_period, 'value') else plan.billing_period
        next_date = sub.next_invoice_date
        if period == 'daily':
            next_date += timedelta(days=1)
        elif period == 'weekly':
            next_date += timedelta(weeks=1)
        elif period == 'monthly':
            next_date += timedelta(days=30)
        elif period == 'quarterly':
            next_date += timedelta(days=90)
        elif period == 'semi_annual':
            next_date += timedelta(days=180)
        elif period == 'yearly':
            next_date += timedelta(days=365)
        sub.next_invoice_date = next_date

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


def delete_invoice(db: Session, invoice_id: int):
    invoice = get_invoice(db, invoice_id)
    if invoice.status != InvoiceStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only DRAFT invoices can be deleted")
    db.delete(invoice)
    db.commit()


def send_invoice(db: Session, invoice_id: int) -> Invoice:
    invoice = get_invoice(db, invoice_id)
    if invoice.status not in [InvoiceStatus.CONFIRMED]:
        raise HTTPException(status_code=400, detail="Only CONFIRMED invoices can be sent")
    # In production this would trigger email/notification; for now just return the invoice
    return invoice


def back_to_draft(db: Session, invoice_id: int) -> Invoice:
    invoice = get_invoice(db, invoice_id)
    if invoice.status not in [InvoiceStatus.CANCELLED, InvoiceStatus.CONFIRMED]:
        raise HTTPException(status_code=400, detail="Only CANCELLED or CONFIRMED invoices can be set back to draft")
    invoice.status = InvoiceStatus.DRAFT
    db.commit()
    db.refresh(invoice)
    return invoice


def pay_invoice(db: Session, invoice_id: int, payment_method: str = "credit_card", amount: Decimal | None = None, payment_date: date | None = None) -> Invoice:
    """Register a payment against an invoice. Marks as PAID when fully paid."""
    from sqlalchemy import func

    invoice = get_invoice(db, invoice_id)
    if invoice.status != InvoiceStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail="Only CONFIRMED invoices can be paid")

    pay_amount = amount if amount else invoice.total
    if pay_amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than zero")

    pay_date = payment_date if payment_date else date.today()

    payment = Payment(
        invoice_id=invoice.id,
        user_id=invoice.customer_id,
        payment_method=payment_method,
        amount=pay_amount,
        payment_date=pay_date,
        reference=f"PAY-{invoice.invoice_number}",
        notes="Payment recorded via invoice",
    )
    db.add(payment)
    db.flush()

    # Check if total paid covers invoice total
    total_paid = db.query(func.sum(Payment.amount)).filter(
        Payment.invoice_id == invoice.id
    ).scalar() or Decimal("0")

    if total_paid >= invoice.total:
        invoice.status = InvoiceStatus.PAID

    db.commit()
    db.refresh(invoice)
    return invoice


def generate_invoice_pdf(db: Session, invoice_id: int) -> bytes:
    """Generate a text-based invoice document."""
    invoice = get_invoice(db, invoice_id)
    customer = db.query(User).filter(User.id == invoice.customer_id).first()

    lines_text = []
    for line in invoice.lines:
        lines_text.append(
            f"  Product #{line.product_id} | Qty: {line.quantity} | "
            f"Price: {float(line.unit_price):.2f} | "
            f"Tax: {float(line.tax_amount):.2f} | "
            f"Discount: {float(line.discount_amount):.2f} | "
            f"Total: {float(line.line_total):.2f}"
        )

    content = f"""
INVOICE
{'=' * 60}
Invoice Number: {invoice.invoice_number}
Issue Date: {invoice.issue_date}
Due Date: {invoice.due_date or 'N/A'}
Status: {invoice.status.value if hasattr(invoice.status, 'value') else invoice.status}

CUSTOMER
{'-' * 60}
Name: {customer.full_name if customer else 'N/A'}
Email: {customer.email if customer else 'N/A'}
Phone: {customer.phone if customer else 'N/A'}
Address: {', '.join(filter(None, [customer.street, customer.city, customer.state, customer.zip_code, customer.country])) if customer else 'N/A'}

ITEMS
{'-' * 60}
{chr(10).join(lines_text) if lines_text else '  No items'}

TOTALS
{'-' * 60}
  Subtotal:     Rs. {float(invoice.subtotal):.2f}
  Tax:          Rs. {float(invoice.tax_total):.2f}
  Discount:     Rs. {float(invoice.discount_total):.2f}
  TOTAL:        Rs. {float(invoice.total):.2f}
{'=' * 60}
"""
    return content.encode("utf-8")
