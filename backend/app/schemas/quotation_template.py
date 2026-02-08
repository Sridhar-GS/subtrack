from pydantic import BaseModel
from decimal import Decimal


class QuotationTemplateLineCreate(BaseModel):
    product_id: int
    quantity: int = 1
    unit_price: Decimal


class QuotationTemplateLineOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal

    class Config:
        from_attributes = True


class QuotationTemplateCreate(BaseModel):
    name: str
    validity_days: int = 30
    recurring_plan_id: int | None = None
    lines: list[QuotationTemplateLineCreate] = []


class QuotationTemplateUpdate(BaseModel):
    name: str | None = None
    validity_days: int | None = None
    recurring_plan_id: int | None = None
    lines: list[QuotationTemplateLineCreate] | None = None


class QuotationTemplateOut(BaseModel):
    id: int
    name: str
    validity_days: int
    recurring_plan_id: int | None = None
    lines: list[QuotationTemplateLineOut] = []

    class Config:
        from_attributes = True
