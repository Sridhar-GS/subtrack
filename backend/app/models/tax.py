from sqlalchemy import Column, Integer, String, Numeric, Boolean

from app.database import Base
from app.models.base import TimestampMixin


class Tax(TimestampMixin, Base):
    __tablename__ = "taxes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    tax_type = Column(String(100), nullable=False)
    rate = Column(Numeric(5, 2), nullable=False)
    is_active = Column(Boolean, default=True)
    description = Column(String(500), nullable=True)
