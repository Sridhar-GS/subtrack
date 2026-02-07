from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user, require_role
from app.models.user import User
from app.enums import UserRole
from app.schemas.invoice import InvoiceOut
from app.services import invoice_service

router = APIRouter()


@router.post("/generate/{subscription_id}", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
def generate_invoice(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    return invoice_service.generate_invoice(db, subscription_id)


@router.get("/", response_model=list[InvoiceOut])
def list_invoices(
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
    customer_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.PORTAL:
        customer_id = current_user.id
    return invoice_service.get_invoices(db, skip, limit, status, customer_id)


@router.get("/{invoice_id}", response_model=InvoiceOut)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = invoice_service.get_invoice(db, invoice_id)
    if current_user.role == UserRole.PORTAL and invoice.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return invoice


@router.post("/{invoice_id}/confirm", response_model=InvoiceOut)
def confirm_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    return invoice_service.confirm_invoice(db, invoice_id)


@router.post("/{invoice_id}/cancel", response_model=InvoiceOut)
def cancel_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return invoice_service.cancel_invoice(db, invoice_id)


@router.post("/{invoice_id}/send")
def send_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    return invoice_service.send_invoice(db, invoice_id)
