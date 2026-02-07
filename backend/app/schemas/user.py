from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str | None = None
    company: str | None = None
    role: str = "internal"


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    company: str | None = None
    is_active: bool | None = None


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    phone: str | None = None
    company: str | None = None
    role: str
    is_active: bool

    class Config:
        from_attributes = True
