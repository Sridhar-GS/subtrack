from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.product import Product, ProductVariant
from app.schemas.product import ProductCreate, ProductUpdate, VariantCreate, VariantUpdate


def create_product(db: Session, data: ProductCreate) -> Product:
    product = Product(
        name=data.name,
        product_type=data.product_type,
        sales_price=data.sales_price,
        cost_price=data.cost_price,
        description=data.description,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def get_products(db: Session, skip: int = 0, limit: int = 100) -> list[Product]:
    return db.query(Product).filter(Product.is_active == True).offset(skip).limit(limit).all()


def get_product(db: Session, product_id: int) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def update_product(db: Session, product_id: int, data: ProductUpdate) -> Product:
    product = get_product(db, product_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int):
    product = get_product(db, product_id)
    product.is_active = False
    db.commit()


def create_variant(db: Session, product_id: int, data: VariantCreate) -> ProductVariant:
    get_product(db, product_id)
    variant = ProductVariant(
        product_id=product_id,
        attribute=data.attribute,
        value=data.value,
        extra_price=data.extra_price,
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return variant


def get_variants(db: Session, product_id: int) -> list[ProductVariant]:
    get_product(db, product_id)
    return db.query(ProductVariant).filter(ProductVariant.product_id == product_id).all()


def update_variant(db: Session, variant_id: int, data: VariantUpdate) -> ProductVariant:
    variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(variant, field, value)
    db.commit()
    db.refresh(variant)
    return variant


def delete_variant(db: Session, variant_id: int):
    variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    db.delete(variant)
    db.commit()
