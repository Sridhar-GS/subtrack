from sqlalchemy import Column, Integer, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import TimestampMixin


class Cart(TimestampMixin, Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    user = relationship("User", backref="cart")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")


class CartItem(TimestampMixin, Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    plan_id = Column(Integer, ForeignKey("recurring_plans.id"), nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(12, 2), nullable=False)

    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")
    plan = relationship("RecurringPlan")
