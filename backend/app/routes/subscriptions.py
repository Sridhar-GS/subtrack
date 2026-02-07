from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user, require_role
from app.models.user import User
from app.enums import UserRole
from app.schemas.subscription import (
    SubscriptionCreate, SubscriptionUpdate, SubscriptionOut,
    SubscriptionLineCreate, SubscriptionLineUpdate, SubscriptionLineOut,
    StatusTransitionRequest,
)
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
