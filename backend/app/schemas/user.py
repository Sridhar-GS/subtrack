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
    street: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    country: str | None = None

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    company: str | None = None
    street: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    country: str | None = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
