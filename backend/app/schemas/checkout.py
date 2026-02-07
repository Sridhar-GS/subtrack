from pydantic import BaseModel


class CheckoutRequest(BaseModel):
    plan_id: int
    payment_method: str = "credit_card"
    discount_code: str | None = None
    street: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    country: str | None = None


class CheckoutResponse(BaseModel):
    subscription_id: int
    subscription_number: str
    invoice_id: int
    invoice_number: str
    payment_id: int
    total: float
    message: str
