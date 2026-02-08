from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user, require_role
from app.models.user import User
from app.models.discount import Discount
from app.enums import UserRole
from app.schemas.discount import DiscountCreate, DiscountUpdate, DiscountOut
from app.services import discount_service
from pydantic import BaseModel
from datetime import date
from decimal import Decimal

router = APIRouter()


class ValidateDiscountRequest(BaseModel):
    code: str
    subtotal: Decimal | None = None
    quantity: int | None = None


class ValidateDiscountResponse(BaseModel):
    valid: bool
    discount_id: int | None = None
    name: str | None = None
    discount_type: str | None = None
    value: float | None = None
    message: str


@router.post("/validate-code", response_model=ValidateDiscountResponse)
def validate_discount_code(
    data: ValidateDiscountRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    discount = db.query(Discount).filter(
        Discount.name == data.code,
        Discount.is_active == True,
    ).first()
    if not discount:
        return {"valid": False, "message": "Invalid discount code"}
    if discount.start_date and discount.start_date > date.today():
        return {"valid": False, "message": "Discount not yet active"}
    if discount.end_date and discount.end_date < date.today():
        return {"valid": False, "message": "Discount has expired"}
    if discount.limit_usage and discount.usage_count >= discount.limit_usage:
        return {"valid": False, "message": "Discount usage limit reached"}
    if discount.min_purchase and data.subtotal and data.subtotal < discount.min_purchase:
        return {"valid": False, "message": f"Minimum purchase of Rs. {discount.min_purchase} required"}
    if discount.min_quantity and data.quantity and data.quantity < discount.min_quantity:
        return {"valid": False, "message": f"Minimum quantity of {discount.min_quantity} required"}
    return {
        "valid": True,
        "discount_id": discount.id,
        "name": discount.name,
        "discount_type": discount.discount_type.value,
        "value": float(discount.value),
        "message": "Discount is valid",
    }


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
