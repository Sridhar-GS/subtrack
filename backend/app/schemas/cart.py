from pydantic import BaseModel
from decimal import Decimal


class CartItemAdd(BaseModel):
    product_id: int
    variant_id: int | None = None
    plan_id: int | None = None
    quantity: int = 1
    unit_price: Decimal


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemOut(BaseModel):
    id: int
    product_id: int
    variant_id: int | None = None
    plan_id: int | None = None
    quantity: int
    unit_price: Decimal
    product_name: str | None = None
    variant_name: str | None = None
    plan_name: str | None = None

    class Config:
        from_attributes = True


class CartOut(BaseModel):
    id: int
    user_id: int
    items: list[CartItemOut] = []

    class Config:
        from_attributes = True
