from pydantic import BaseModel
from decimal import Decimal


class ProductCreate(BaseModel):
    name: str
    product_type: str = "service"
    sales_price: Decimal
    cost_price: Decimal
    description: str | None = None


class ProductUpdate(BaseModel):
    name: str | None = None
    product_type: str | None = None
    sales_price: Decimal | None = None
    cost_price: Decimal | None = None
    description: str | None = None


class VariantCreate(BaseModel):
    attribute: str
    value: str
    extra_price: Decimal = Decimal("0.00")


class VariantUpdate(BaseModel):
    attribute: str | None = None
    value: str | None = None
    extra_price: Decimal | None = None


class VariantOut(BaseModel):
    id: int
    product_id: int
    attribute: str
    value: str
    extra_price: Decimal

    class Config:
        from_attributes = True


class ProductOut(BaseModel):
    id: int
    name: str
    product_type: str
    sales_price: Decimal
    cost_price: Decimal
    description: str | None = None
    is_active: bool
    variants: list[VariantOut] = []

    class Config:
        from_attributes = True
