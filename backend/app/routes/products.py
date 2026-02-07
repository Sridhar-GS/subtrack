from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user, require_role
from app.models.user import User
from app.models.product import Product, ProductVariant
from app.models.recurring_plan import RecurringPlan
from app.enums import UserRole
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut
from app.services import product_service

router = APIRouter()


@router.get("/public", response_model=list[ProductOut])
def list_public_products(
    search: str | None = None,
    product_type: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(Product).filter(Product.is_active == True)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    if product_type:
        query = query.filter(Product.product_type == product_type)
    return query.offset(skip).limit(limit).all()


@router.get("/public/{product_id}", response_model=ProductOut)
def get_public_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return product_service.create_product(db, data)


@router.get("/", response_model=list[ProductOut])
def list_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return product_service.get_products(db, skip, limit)


@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return product_service.get_product(db, product_id)


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return product_service.update_product(db, product_id, data)


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    product_service.delete_product(db, product_id)
    return {"message": "Product deactivated"}
