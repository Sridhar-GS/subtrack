from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.models.user import User
from app.enums import UserRole
from app.schemas.quotation_template import (
    QuotationTemplateCreate, QuotationTemplateUpdate, QuotationTemplateOut,
)
from app.services import quotation_template_service

router = APIRouter()


@router.post("/", response_model=QuotationTemplateOut, status_code=status.HTTP_201_CREATED)
def create_template(
    data: QuotationTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return quotation_template_service.create_template(db, data)


@router.get("/", response_model=list[QuotationTemplateOut])
def list_templates(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    return quotation_template_service.get_templates(db, skip, limit)


@router.get("/{template_id}", response_model=QuotationTemplateOut)
def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    return quotation_template_service.get_template(db, template_id)


@router.put("/{template_id}", response_model=QuotationTemplateOut)
def update_template(
    template_id: int,
    data: QuotationTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return quotation_template_service.update_template(db, template_id, data)


@router.delete("/{template_id}")
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    quotation_template_service.delete_template(db, template_id)
    return {"message": "Template deleted"}
