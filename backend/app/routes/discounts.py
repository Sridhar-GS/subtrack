from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.models.user import User
from app.enums import UserRole
from app.schemas.discount import DiscountCreate, DiscountUpdate, DiscountOut
from app.services import discount_service

router = APIRouter()


@router.post("/", response_model=DiscountOut, status_code=status.HTTP_201_CREATED)
def create_discount(
    data: DiscountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return discount_service.create_discount(db, data)


@router.get("/", response_model=list[DiscountOut])
def list_discounts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    return discount_service.get_discounts(db, skip, limit)


@router.get("/{discount_id}", response_model=DiscountOut)
def get_discount(
    discount_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    return discount_service.get_discount(db, discount_id)


@router.put("/{discount_id}", response_model=DiscountOut)
def update_discount(
    discount_id: int,
    data: DiscountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return discount_service.update_discount(db, discount_id, data)


@router.delete("/{discount_id}")
def delete_discount(
    discount_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    discount_service.delete_discount(db, discount_id)
    return {"message": "Discount deleted"}
