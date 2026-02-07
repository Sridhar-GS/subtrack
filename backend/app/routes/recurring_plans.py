from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user, require_role
from app.models.user import User
from app.enums import UserRole
from app.schemas.recurring_plan import RecurringPlanCreate, RecurringPlanUpdate, RecurringPlanOut
from app.services import recurring_plan_service

router = APIRouter()


@router.post("/", response_model=RecurringPlanOut, status_code=status.HTTP_201_CREATED)
def create_plan(
    data: RecurringPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return recurring_plan_service.create_plan(db, data)


@router.get("/", response_model=list[RecurringPlanOut])
def list_plans(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return recurring_plan_service.get_plans(db, skip, limit)


@router.get("/{plan_id}", response_model=RecurringPlanOut)
def get_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return recurring_plan_service.get_plan(db, plan_id)


@router.put("/{plan_id}", response_model=RecurringPlanOut)
def update_plan(
    plan_id: int,
    data: RecurringPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return recurring_plan_service.update_plan(db, plan_id, data)


@router.delete("/{plan_id}")
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    recurring_plan_service.delete_plan(db, plan_id)
    return {"message": "Recurring plan deleted"}
