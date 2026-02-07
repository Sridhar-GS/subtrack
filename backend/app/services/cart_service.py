from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.cart import Cart, CartItem
from app.models.product import Product, ProductVariant
from app.models.recurring_plan import RecurringPlan
from app.schemas.cart import CartItemAdd, CartItemUpdate


def get_or_create_cart(db: Session, user_id: int) -> Cart:
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def get_cart_with_details(db: Session, user_id: int) -> dict:
    cart = get_or_create_cart(db, user_id)
    items = []
    for item in cart.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        variant = db.query(ProductVariant).filter(ProductVariant.id == item.variant_id).first() if item.variant_id else None
        plan = db.query(RecurringPlan).filter(RecurringPlan.id == item.plan_id).first() if item.plan_id else None
        items.append({
            "id": item.id,
            "product_id": item.product_id,
            "variant_id": item.variant_id,
            "plan_id": item.plan_id,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "product_name": product.name if product else None,
            "variant_name": f"{variant.attribute}: {variant.value}" if variant else None,
            "plan_name": plan.name if plan else None,
        })
    return {"id": cart.id, "user_id": cart.user_id, "items": items}


def add_item(db: Session, user_id: int, data: CartItemAdd) -> CartItem:
    cart = get_or_create_cart(db, user_id)
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == data.product_id,
        CartItem.variant_id == data.variant_id,
        CartItem.plan_id == data.plan_id,
    ).first()

    if existing:
        existing.quantity += data.quantity
        existing.unit_price = data.unit_price
        db.commit()
        db.refresh(existing)
        return existing

    item = CartItem(
        cart_id=cart.id,
        product_id=data.product_id,
        variant_id=data.variant_id,
        plan_id=data.plan_id,
        quantity=data.quantity,
        unit_price=data.unit_price,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_item(db: Session, user_id: int, item_id: int, data: CartItemUpdate) -> CartItem:
    cart = get_or_create_cart(db, user_id)
    item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    item.quantity = data.quantity
    db.commit()
    db.refresh(item)
    return item


def remove_item(db: Session, user_id: int, item_id: int):
    cart = get_or_create_cart(db, user_id)
    item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.delete(item)
    db.commit()


def clear_cart(db: Session, user_id: int):
    cart = get_or_create_cart(db, user_id)
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()
