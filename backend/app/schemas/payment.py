from pydantic import BaseModel
from decimal import Decimal
from datetime import date


class PaymentCreate(BaseModel):
    invoice_id: int
    payment_method: str
    amount: Decimal
    payment_date: date
    reference: str | None = None
    notes: str | None = None


class PaymentOut(BaseModel):
    id: int
    invoice_id: int
    user_id: int
    payment_method: str
    amount: Decimal
    payment_date: date
    reference: str | None = None
    notes: str | None = None

    class Config:
        from_attributes = True
