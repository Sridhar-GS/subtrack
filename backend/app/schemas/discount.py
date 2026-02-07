from pydantic import BaseModel
from decimal import Decimal
from datetime import date


class DiscountCreate(BaseModel):
    name: str
    discount_type: str
    value: Decimal
    min_purchase: Decimal | None = Decimal("0")
    min_quantity: int | None = 0
    start_date: date | None = None
    end_date: date | None = None
    limit_usage: int | None = None
    product_ids: list[int] = []


class DiscountUpdate(BaseModel):
    name: str | None = None
    discount_type: str | None = None
    value: Decimal | None = None
    min_purchase: Decimal | None = None
    min_quantity: int | None = None
    start_date: date | None = None
    end_date: date | None = None
    limit_usage: int | None = None
    is_active: bool | None = None
    product_ids: list[int] | None = None


class DiscountOut(BaseModel):
    id: int
    name: str
    discount_type: str
    value: Decimal
    min_purchase: Decimal | None = None
    min_quantity: int | None = None
    start_date: date | None = None
    end_date: date | None = None
    limit_usage: int | None = None
    usage_count: int
    is_active: bool

    class Config:
        from_attributes = True
