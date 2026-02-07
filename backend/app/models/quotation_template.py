from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import TimestampMixin


class QuotationTemplate(TimestampMixin, Base):
    __tablename__ = "quotation_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    validity_days = Column(Integer, nullable=False, default=30)
    recurring_plan_id = Column(Integer, ForeignKey("recurring_plans.id"), nullable=True)

    recurring_plan = relationship("RecurringPlan")
    lines = relationship("QuotationTemplateLine", back_populates="template",
                          cascade="all, delete-orphan")


class QuotationTemplateLine(TimestampMixin, Base):
    __tablename__ = "quotation_template_lines"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("quotation_templates.id", ondelete="CASCADE"),
                         nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(12, 2), nullable=False)

    template = relationship("QuotationTemplate", back_populates="lines")
    product = relationship("Product")
