from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.tax import Tax
from app.schemas.tax import TaxCreate, TaxUpdate


def create_tax(db: Session, data: TaxCreate) -> Tax:
    tax = Tax(
        name=data.name,
        tax_type=data.tax_type,
        rate=data.rate,
        description=data.description,
    )
    db.add(tax)
    db.commit()
    db.refresh(tax)
    return tax


def get_taxes(db: Session, skip: int = 0, limit: int = 100) -> list[Tax]:
    return db.query(Tax).filter(Tax.is_active == True).offset(skip).limit(limit).all()


def get_tax(db: Session, tax_id: int) -> Tax:
    tax = db.query(Tax).filter(Tax.id == tax_id).first()
    if not tax:
        raise HTTPException(status_code=404, detail="Tax not found")
    return tax


def update_tax(db: Session, tax_id: int, data: TaxUpdate) -> Tax:
    tax = get_tax(db, tax_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tax, field, value)
    db.commit()
    db.refresh(tax)
    return tax


def delete_tax(db: Session, tax_id: int):
    tax = get_tax(db, tax_id)
    db.delete(tax)
    db.commit()
