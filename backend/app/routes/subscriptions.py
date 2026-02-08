from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user, require_role
from app.models.user import User
from app.enums import UserRole, SubscriptionStatus
from app.schemas.subscription import (
    SubscriptionCreate, SubscriptionUpdate, SubscriptionOut,
    SubscriptionLineCreate, SubscriptionLineUpdate, SubscriptionLineOut,
    StatusTransitionRequest,
)
from app.models.recurring_plan import RecurringPlan
from app.services import subscription_service

router = APIRouter()


@router.post("/", response_model=SubscriptionOut, status_code=status.HTTP_201_CREATED)
def create_subscription(
    data: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    return subscription_service.create_subscription(db, data)


@router.get("/", response_model=list[SubscriptionOut])
def list_subscriptions(
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
    customer_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.PORTAL:
        customer_id = current_user.id
    return subscription_service.get_subscriptions(db, skip, limit, status, customer_id)


@router.get("/{sub_id}", response_model=SubscriptionOut)
def get_subscription(
    sub_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sub = subscription_service.get_subscription(db, sub_id)
    if current_user.role == UserRole.PORTAL and sub.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return sub


@router.put("/{sub_id}", response_model=SubscriptionOut)
def update_subscription(
    sub_id: int,
    data: SubscriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    return subscription_service.update_subscription(db, sub_id, data)


@router.delete("/{sub_id}")
def delete_subscription(
    sub_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    subscription_service.delete_subscription(db, sub_id)
    return {"message": "Subscription deleted"}


@router.post("/{sub_id}/lines", response_model=SubscriptionLineOut, status_code=status.HTTP_201_CREATED)
def add_line(
    sub_id: int,
    data: SubscriptionLineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    return subscription_service.add_line(db, sub_id, data)


@router.put("/{sub_id}/lines/{line_id}", response_model=SubscriptionLineOut)
def update_line(
    sub_id: int,
    line_id: int,
    data: SubscriptionLineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    return subscription_service.update_line(db, sub_id, line_id, data)


@router.delete("/{sub_id}/lines/{line_id}")
def delete_line(
    sub_id: int,
    line_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    subscription_service.delete_line(db, sub_id, line_id)
    return {"message": "Line removed"}


@router.post("/{sub_id}/transition", response_model=SubscriptionOut)
def transition_status(
    sub_id: int,
    data: StatusTransitionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    return subscription_service.transition_status(db, sub_id, data.action)


@router.post("/{sub_id}/portal-close", response_model=SubscriptionOut)
def portal_close_subscription(
    sub_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sub = subscription_service.get_subscription(db, sub_id)
    if sub.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your subscription")
    plan = db.query(RecurringPlan).filter(RecurringPlan.id == sub.plan_id).first()
    if plan and not plan.closable:
        raise HTTPException(status_code=400, detail="This plan does not allow closing")
    return subscription_service.transition_status(db, sub_id, "close")


@router.post("/{sub_id}/portal-renew", response_model=SubscriptionOut)
def portal_renew_subscription(
    sub_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sub = subscription_service.get_subscription(db, sub_id)
    if sub.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your subscription")
    return subscription_service.renew_subscription(db, sub_id)


@router.post("/{sub_id}/renew", response_model=SubscriptionOut)
def renew_subscription(
    sub_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    return subscription_service.renew_subscription(db, sub_id)


@router.post("/{sub_id}/upsell", response_model=SubscriptionOut)
def upsell_subscription(
    sub_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    return subscription_service.upsell_subscription(db, sub_id)


@router.get("/{sub_id}/history", response_model=list[SubscriptionOut])
def get_subscription_history(
    sub_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sub = subscription_service.get_subscription(db, sub_id)
    if current_user.role == UserRole.PORTAL and sub.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return subscription_service.get_subscription_history(db, sub_id)
