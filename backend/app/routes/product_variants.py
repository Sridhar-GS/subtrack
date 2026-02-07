from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user, require_role
from app.models.user import User
from app.enums import UserRole
from app.schemas.product import VariantCreate, VariantUpdate, VariantOut
from app.services import product_service

router = APIRouter()


@router.post("/{product_id}/variants", response_model=VariantOut, status_code=status.HTTP_201_CREATED)
def create_variant(
    product_id: int,
    data: VariantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return product_service.create_variant(db, product_id, data)


@router.get("/{product_id}/variants", response_model=list[VariantOut])
def list_variants(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return product_service.get_variants(db, product_id)


@router.put("/{product_id}/variants/{variant_id}", response_model=VariantOut)
def update_variant(
    product_id: int,
    variant_id: int,
    data: VariantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return product_service.update_variant(db, variant_id, data)


@router.delete("/{product_id}/variants/{variant_id}")
def delete_variant(
    product_id: int,
    variant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    product_service.delete_variant(db, variant_id)
    return {"message": "Variant deleted"}
