from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.checkout import CheckoutRequest, CheckoutResponse
from app.services import checkout_service

router = APIRouter()


@router.post("/", response_model=CheckoutResponse)
def checkout(
    data: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return checkout_service.checkout(db, current_user.id, data)
