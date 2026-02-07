from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.discount import Discount
from app.models.product import Product
from app.schemas.discount import DiscountCreate, DiscountUpdate


def create_discount(db: Session, data: DiscountCreate) -> Discount:
    discount = Discount(
        name=data.name,
        discount_type=data.discount_type,
        value=data.value,
        min_purchase=data.min_purchase,
        min_quantity=data.min_quantity,
        start_date=data.start_date,
        end_date=data.end_date,
        limit_usage=data.limit_usage,
    )
    if data.product_ids:
        products = db.query(Product).filter(Product.id.in_(data.product_ids)).all()
        discount.products = products
    db.add(discount)
    db.commit()
    db.refresh(discount)
    return discount


def get_discounts(db: Session, skip: int = 0, limit: int = 100) -> list[Discount]:
    return db.query(Discount).filter(Discount.is_active == True).offset(skip).limit(limit).all()


def get_discount(db: Session, discount_id: int) -> Discount:
    discount = db.query(Discount).filter(Discount.id == discount_id).first()
    if not discount:
        raise HTTPException(status_code=404, detail="Discount not found")
    return discount


def update_discount(db: Session, discount_id: int, data: DiscountUpdate) -> Discount:
    discount = get_discount(db, discount_id)
    update_data = data.model_dump(exclude_unset=True)
    product_ids = update_data.pop("product_ids", None)
    for field, value in update_data.items():
        setattr(discount, field, value)
    if product_ids is not None:
        products = db.query(Product).filter(Product.id.in_(product_ids)).all()
        discount.products = products
    db.commit()
    db.refresh(discount)
    return discount


def delete_discount(db: Session, discount_id: int):
    discount = get_discount(db, discount_id)
    db.delete(discount)
    db.commit()
