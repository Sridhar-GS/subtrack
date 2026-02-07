from pydantic import BaseModel
from decimal import Decimal
from datetime import date


class InvoiceLineOut(BaseModel):
    id: int
    product_id: int
    description: str | None = None
    quantity: int
    unit_price: Decimal
    tax_id: int | None = None
    tax_amount: Decimal
    discount_amount: Decimal
    line_total: Decimal

    class Config:
        from_attributes = True


class InvoiceOut(BaseModel):
    id: int
    invoice_number: str
    subscription_id: int
    customer_id: int
    issue_date: date
    due_date: date | None = None
    status: str
    subtotal: Decimal
    tax_total: Decimal
    discount_total: Decimal
    total: Decimal
    notes: str | None = None
    lines: list[InvoiceLineOut] = []

    class Config:
        from_attributes = True
