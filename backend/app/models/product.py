from sqlalchemy import Column, Integer, String, Numeric, Boolean, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import TimestampMixin
from app.enums import ProductType


class Product(TimestampMixin, Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    product_type = Column(SAEnum(ProductType), nullable=False, default=ProductType.SERVICE)
    sales_price = Column(Numeric(12, 2), nullable=False, default=0)
    cost_price = Column(Numeric(12, 2), nullable=False, default=0)
    description = Column(String(1000), nullable=True)
    is_active = Column(Boolean, default=True)

    variants = relationship("ProductVariant", back_populates="product",
                            cascade="all, delete-orphan")


class ProductVariant(TimestampMixin, Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    attribute = Column(String(255), nullable=False)
    value = Column(String(255), nullable=False)
    extra_price = Column(Numeric(12, 2), nullable=False, default=0)

    product = relationship("Product", back_populates="variants")
