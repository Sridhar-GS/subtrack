from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.cart import CartItemAdd, CartItemUpdate, CartOut
from app.services import cart_service

router = APIRouter()


@router.get("/", response_model=CartOut)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return cart_service.get_cart_with_details(db, current_user.id)


@router.post("/items", status_code=status.HTTP_201_CREATED)
def add_cart_item(
    data: CartItemAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart_service.add_item(db, current_user.id, data)
    return cart_service.get_cart_with_details(db, current_user.id)


@router.put("/items/{item_id}")
def update_cart_item(
    item_id: int,
    data: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart_service.update_item(db, current_user.id, item_id, data)
    return cart_service.get_cart_with_details(db, current_user.id)


@router.delete("/items/{item_id}")
def remove_cart_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart_service.remove_item(db, current_user.id, item_id)
    return {"message": "Item removed"}


@router.delete("/")
def clear_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart_service.clear_cart(db, current_user.id)
    return {"message": "Cart cleared"}
