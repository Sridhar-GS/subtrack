import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user, require_role
from app.models.user import User
from app.models.product import Product, ProductVariant
from app.models.recurring_plan import RecurringPlan
from app.enums import UserRole
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut
from app.services import product_service

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads", "products")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

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


@router.post("/{product_id}/image", response_model=ProductOut)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    product = product_service.get_product(db, product_id)

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Use: {', '.join(ALLOWED_EXTENSIONS)}")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum 5MB.")

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Remove old image if exists
    if product.image_url:
        old_abs = os.path.normpath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), product.image_url.lstrip("/")))
        if os.path.exists(old_abs):
            os.remove(old_abs)

    filename = f"{product_id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    product.image_url = f"uploads/products/{filename}"
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}/image", response_model=ProductOut)
def delete_product_image(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    product = product_service.get_product(db, product_id)
    if not product.image_url:
        raise HTTPException(status_code=400, detail="Product has no image")

    abs_path = os.path.normpath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), product.image_url.lstrip("/")))
    if os.path.exists(abs_path):
        os.remove(abs_path)

    product.image_url = None
    db.commit()
    db.refresh(product)
    return product
