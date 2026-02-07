from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.models.user import User
from app.enums import UserRole
from app.schemas.tax import TaxCreate, TaxUpdate, TaxOut
from app.services import tax_service

router = APIRouter()


@router.post("/", response_model=TaxOut, status_code=status.HTTP_201_CREATED)
def create_tax(
    data: TaxCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return tax_service.create_tax(db, data)


@router.get("/", response_model=list[TaxOut])
def list_taxes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    return tax_service.get_taxes(db, skip, limit)


@router.get("/{tax_id}", response_model=TaxOut)
def get_tax(
    tax_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    return tax_service.get_tax(db, tax_id)


@router.put("/{tax_id}", response_model=TaxOut)
def update_tax(
    tax_id: int,
    data: TaxUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return tax_service.update_tax(db, tax_id, data)


@router.delete("/{tax_id}")
def delete_tax(
    tax_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    tax_service.delete_tax(db, tax_id)
    return {"message": "Tax deleted"}
