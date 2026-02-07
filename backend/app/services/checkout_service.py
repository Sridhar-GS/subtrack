from decimal import Decimal
from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.models.subscription import Subscription, SubscriptionLine
from app.models.invoice import Invoice, InvoiceLine
from app.models.payment import Payment
from app.models.recurring_plan import RecurringPlan
from app.models.discount import Discount
from app.enums import SubscriptionStatus, InvoiceStatus
from app.utils.sequence import generate_sequence
from app.schemas.checkout import CheckoutRequest


def checkout(db: Session, user_id: int, data: CheckoutRequest) -> dict:
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    plan = db.query(RecurringPlan).filter(RecurringPlan.id == data.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Recurring plan not found")

    discount_amount = Decimal("0")
    discount_obj = None
    if data.discount_code:
        discount_obj = db.query(Discount).filter(
            Discount.name == data.discount_code,
            Discount.is_active == True,
        ).first()
        if not discount_obj:
            raise HTTPException(status_code=400, detail="Invalid discount code")
        if discount_obj.limit_usage and discount_obj.usage_count >= discount_obj.limit_usage:
            raise HTTPException(status_code=400, detail="Discount usage limit reached")

    sub_number = generate_sequence(db, Subscription, "SUB", "subscription_number")
    subscription = Subscription(
        subscription_number=sub_number,
        customer_id=user_id,
        plan_id=data.plan_id,
        start_date=date.today(),
        status=SubscriptionStatus.ACTIVE,
    )
    db.add(subscription)
    db.flush()

    subtotal = Decimal("0")
    for cart_item in cart.items:
        item_amount = Decimal(str(cart_item.quantity)) * cart_item.unit_price
        line = SubscriptionLine(
            subscription_id=subscription.id,
            product_id=cart_item.product_id,
            quantity=cart_item.quantity,
            unit_price=cart_item.unit_price,
            amount=item_amount,
        )
        db.add(line)
        subtotal += item_amount

    if discount_obj:
        if discount_obj.discount_type.value == "percentage":
            discount_amount = subtotal * discount_obj.value / Decimal("100")
        else:
            discount_amount = discount_obj.value
        discount_amount = min(discount_amount, subtotal)
        discount_obj.usage_count += 1

    inv_number = generate_sequence(db, Invoice, "INV", "invoice_number")
    total = subtotal - discount_amount
    invoice = Invoice(
        invoice_number=inv_number,
        subscription_id=subscription.id,
        customer_id=user_id,
        issue_date=date.today(),
        status=InvoiceStatus.CONFIRMED,
        subtotal=subtotal,
        tax_total=Decimal("0"),
        discount_total=discount_amount,
        total=total,
    )
    db.add(invoice)
    db.flush()

    for cart_item in cart.items:
        product = db.query(Product).filter(Product.id == cart_item.product_id).first()
        inv_line = InvoiceLine(
            invoice_id=invoice.id,
            product_id=cart_item.product_id,
            description=product.name if product else None,
            quantity=cart_item.quantity,
            unit_price=cart_item.unit_price,
            tax_amount=Decimal("0"),
            discount_amount=Decimal("0"),
            line_total=Decimal(str(cart_item.quantity)) * cart_item.unit_price,
        )
        db.add(inv_line)

    payment = Payment(
        invoice_id=invoice.id,
        user_id=user_id,
        payment_method=data.payment_method,
        amount=total,
        payment_date=date.today(),
        reference=f"CHECKOUT-{sub_number}",
    )
    db.add(payment)
    invoice.status = InvoiceStatus.PAID

    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()

    db.commit()
    db.refresh(subscription)
    db.refresh(invoice)
    db.refresh(payment)

    return {
        "subscription_id": subscription.id,
        "subscription_number": subscription.subscription_number,
        "invoice_id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "payment_id": payment.id,
        "total": float(total),
        "message": "Order placed successfully",
    }
