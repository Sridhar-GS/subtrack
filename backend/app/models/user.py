from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum

from app.database import Base
from app.models.base import TimestampMixin
from app.enums import UserRole


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    company = Column(String(255), nullable=True)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.PORTAL)
    is_active = Column(Boolean, default=True)
    reset_token = Column(String(255), nullable=True)
    reset_token_expiry = Column(DateTime(timezone=True), nullable=True)
