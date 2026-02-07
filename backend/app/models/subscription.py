from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import TimestampMixin
from app.enums import SubscriptionStatus


class Subscription(TimestampMixin, Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    subscription_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("recurring_plans.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    expiration_date = Column(Date, nullable=True)
    payment_terms = Column(String(255), nullable=True)
    status = Column(SAEnum(SubscriptionStatus), nullable=False,
                    default=SubscriptionStatus.DRAFT)
    notes = Column(Text, nullable=True)

    customer = relationship("User", backref="subscriptions")
    plan = relationship("RecurringPlan", backref="subscriptions")
    lines = relationship("SubscriptionLine", back_populates="subscription",
                          cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="subscription")


class SubscriptionLine(TimestampMixin, Base):
    __tablename__ = "subscription_lines"

    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id", ondelete="CASCADE"),
                             nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(12, 2), nullable=False)
    tax_id = Column(Integer, ForeignKey("taxes.id"), nullable=True)
    discount_id = Column(Integer, ForeignKey("discounts.id"), nullable=True)
    amount = Column(Numeric(12, 2), nullable=False)

    subscription = relationship("Subscription", back_populates="lines")
    product = relationship("Product")
    tax = relationship("Tax")
    discount = relationship("Discount")
