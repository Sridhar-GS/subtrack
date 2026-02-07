from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import TimestampMixin
from app.enums import InvoiceStatus


class Invoice(TimestampMixin, Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    issue_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=True)
    status = Column(SAEnum(InvoiceStatus), nullable=False, default=InvoiceStatus.DRAFT)
    subtotal = Column(Numeric(12, 2), nullable=False, default=0)
    tax_total = Column(Numeric(12, 2), nullable=False, default=0)
    discount_total = Column(Numeric(12, 2), nullable=False, default=0)
    total = Column(Numeric(12, 2), nullable=False, default=0)
    notes = Column(Text, nullable=True)

    subscription = relationship("Subscription", back_populates="invoices")
    customer = relationship("User", backref="invoices")
    lines = relationship("InvoiceLine", back_populates="invoice",
                          cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice")


class InvoiceLine(TimestampMixin, Base):
    __tablename__ = "invoice_lines"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    description = Column(String(500), nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(12, 2), nullable=False)
    tax_id = Column(Integer, ForeignKey("taxes.id"), nullable=True)
    tax_amount = Column(Numeric(12, 2), nullable=False, default=0)
    discount_amount = Column(Numeric(12, 2), nullable=False, default=0)
    line_total = Column(Numeric(12, 2), nullable=False)

    invoice = relationship("Invoice", back_populates="lines")
    product = relationship("Product")
    tax = relationship("Tax")
