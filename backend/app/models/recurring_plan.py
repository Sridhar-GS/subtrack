from sqlalchemy import Column, Integer, String, Numeric, Date, Boolean, Enum as SAEnum

from app.database import Base
from app.models.base import TimestampMixin
from app.enums import BillingPeriod


class RecurringPlan(TimestampMixin, Base):
    __tablename__ = "recurring_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    price = Column(Numeric(12, 2), nullable=False)
    billing_period = Column(SAEnum(BillingPeriod), nullable=False)
    min_quantity = Column(Integer, nullable=False, default=1)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    auto_close = Column(Boolean, default=False)
    closable = Column(Boolean, default=True)
    pausable = Column(Boolean, default=False)
    renewable = Column(Boolean, default=True)
