from pydantic import BaseModel


class ContactCreate(BaseModel):
    user_id: int
    name: str
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    street: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    country: str | None = None
    notes: str | None = None


class ContactUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    street: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    country: str | None = None
    notes: str | None = None


class ContactOut(BaseModel):
    id: int
    user_id: int
    name: str
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    street: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    country: str | None = None
    notes: str | None = None

    class Config:
        from_attributes = True
