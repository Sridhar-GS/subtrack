from sqlalchemy import Column, Integer, String, Numeric, Date, Boolean, ForeignKey, Table, Enum as SAEnum
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import TimestampMixin
from app.enums import DiscountType


discount_products = Table(
    "discount_products", Base.metadata,
    Column("discount_id", Integer, ForeignKey("discounts.id", ondelete="CASCADE"),
           primary_key=True),
    Column("product_id", Integer, ForeignKey("products.id", ondelete="CASCADE"),
           primary_key=True),
)


class Discount(TimestampMixin, Base):
    __tablename__ = "discounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    discount_type = Column(SAEnum(DiscountType), nullable=False)
    value = Column(Numeric(12, 2), nullable=False)
    min_purchase = Column(Numeric(12, 2), nullable=True, default=0)
    min_quantity = Column(Integer, nullable=True, default=0)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    limit_usage = Column(Integer, nullable=True)
    usage_count = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, default=True)

    products = relationship("Product", secondary=discount_products, backref="discounts")
