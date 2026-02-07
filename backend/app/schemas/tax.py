from pydantic import BaseModel
from decimal import Decimal


class TaxCreate(BaseModel):
    name: str
    tax_type: str
    rate: Decimal
    description: str | None = None


class TaxUpdate(BaseModel):
    name: str | None = None
    tax_type: str | None = None
    rate: Decimal | None = None
    is_active: bool | None = None
    description: str | None = None


class TaxOut(BaseModel):
    id: int
    name: str
    tax_type: str
    rate: Decimal
    is_active: bool
    description: str | None = None

    class Config:
        from_attributes = True
