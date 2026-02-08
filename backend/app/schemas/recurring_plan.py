from pydantic import BaseModel
from decimal import Decimal
from datetime import date


class RecurringPlanCreate(BaseModel):
    name: str
    price: Decimal
    billing_period: str
    min_quantity: int = 1
    start_date: date | None = None
    end_date: date | None = None
    auto_close_days: int | None = None
    closable: bool = True
    pausable: bool = False
    renewable: bool = True


class RecurringPlanUpdate(BaseModel):
    name: str | None = None
    price: Decimal | None = None
    billing_period: str | None = None
    min_quantity: int | None = None
    start_date: date | None = None
    end_date: date | None = None
    auto_close_days: int | None = None
    closable: bool | None = None
    pausable: bool | None = None
    renewable: bool | None = None


class RecurringPlanOut(BaseModel):
    id: int
    name: str
    price: Decimal
    billing_period: str
    min_quantity: int
    start_date: date | None = None
    end_date: date | None = None
    auto_close_days: int | None = None
    closable: bool
    pausable: bool
    renewable: bool

    class Config:
        from_attributes = True
