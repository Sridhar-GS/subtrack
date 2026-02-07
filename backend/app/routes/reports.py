from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.models.user import User
from app.enums import UserRole
from app.services import report_service

router = APIRouter()


@router.get("/active-subscriptions")
def active_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    return report_service.get_active_subscriptions(db)


@router.get("/revenue")
def revenue(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    return report_service.get_revenue(db, start_date, end_date)


@router.get("/payments-summary")
def payments_summary(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    return report_service.get_payments_summary(db, start_date, end_date)


@router.get("/overdue-invoices")
def overdue_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    return report_service.get_overdue_invoices(db)
