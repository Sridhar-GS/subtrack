from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from decimal import Decimal
from datetime import date

from app.dependencies import get_db, get_current_user, require_role
from app.models.user import User
from app.enums import UserRole
from app.schemas.invoice import InvoiceOut
from app.services import invoice_service

router = APIRouter()


class PayInvoiceRequest(BaseModel):
    payment_method: str = "credit_card"
    amount: Decimal | None = None
    payment_date: date | None = None


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


@router.delete("/{invoice_id}")
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    invoice_service.delete_invoice(db, invoice_id)
    return {"message": "Invoice deleted"}


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


@router.post("/{invoice_id}/send", response_model=InvoiceOut)
def send_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    return invoice_service.send_invoice(db, invoice_id)


@router.post("/{invoice_id}/back-to-draft", response_model=InvoiceOut)
def back_to_draft(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return invoice_service.back_to_draft(db, invoice_id)


@router.post("/{invoice_id}/pay", response_model=InvoiceOut)
def pay_invoice(
    invoice_id: int,
    data: PayInvoiceRequest | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    payment_method = data.payment_method if data else "credit_card"
    amount = data.amount if data else None
    payment_date = data.payment_date if data else None
    return invoice_service.pay_invoice(db, invoice_id, payment_method, amount, payment_date)


@router.get("/{invoice_id}/pdf")
def download_invoice_pdf(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = invoice_service.get_invoice(db, invoice_id)
    if current_user.role == UserRole.PORTAL and invoice.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    pdf_bytes = invoice_service.generate_invoice_pdf(db, invoice_id)
    return Response(
        content=pdf_bytes,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename={invoice.invoice_number}.txt"},
    )
