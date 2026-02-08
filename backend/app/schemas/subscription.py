from pydantic import BaseModel
from decimal import Decimal
from datetime import date


class SubscriptionLineCreate(BaseModel):
    product_id: int
    quantity: int = 1
    unit_price: Decimal
    tax_id: int | None = None
    discount_id: int | None = None


class SubscriptionLineUpdate(BaseModel):
    quantity: int | None = None
    unit_price: Decimal | None = None
    tax_id: int | None = None
    discount_id: int | None = None


class SubscriptionLineOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    tax_id: int | None = None
    discount_id: int | None = None
    amount: Decimal

    class Config:
        from_attributes = True


class SubscriptionCreate(BaseModel):
    customer_id: int
    plan_id: int
    salesperson_id: int | None = None
    start_date: date
    expiration_date: date | None = None
    payment_terms: str | None = None
    notes: str | None = None
    lines: list[SubscriptionLineCreate] = []


class SubscriptionUpdate(BaseModel):
    plan_id: int | None = None
    salesperson_id: int | None = None
    start_date: date | None = None
    expiration_date: date | None = None
    payment_terms: str | None = None
    notes: str | None = None


class SubscriptionOut(BaseModel):
    id: int
    subscription_number: str
    customer_id: int
    plan_id: int
    salesperson_id: int | None = None
    parent_id: int | None = None
    start_date: date
    expiration_date: date | None = None
    payment_terms: str | None = None
    status: str
    notes: str | None = None
    next_invoice_date: date | None = None
    lines: list[SubscriptionLineOut] = []

    class Config:
        from_attributes = True


class StatusTransitionRequest(BaseModel):
    action: str
