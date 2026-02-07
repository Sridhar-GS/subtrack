from pydantic import BaseModel, EmailStr


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str | None = None
    company: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


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


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class FirebaseAuthRequest(BaseModel):
    token: str
    full_name: str | None = None
    phone: str | None = None
    company: str | None = None
