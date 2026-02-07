from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user, require_role
from app.models.user import User
from app.enums import UserRole
from app.schemas.payment import PaymentCreate, PaymentOut
from app.services import payment_service

router = APIRouter()


@router.post("/", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def create_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    return payment_service.create_payment(db, data, current_user.id)


@router.get("/", response_model=list[PaymentOut])
def list_payments(
    skip: int = 0,
    limit: int = 100,
    invoice_id: int | None = None,
    customer_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.PORTAL:
        customer_id = current_user.id
    return payment_service.get_payments(db, skip, limit, invoice_id, customer_id)


@router.get("/{payment_id}", response_model=PaymentOut)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = payment_service.get_payment(db, payment_id)
    if current_user.role == UserRole.PORTAL and payment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return payment
