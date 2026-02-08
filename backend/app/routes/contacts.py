from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user, require_role
from app.models.user import User
from app.models.contact import Contact
from app.enums import UserRole
from app.schemas.contact import ContactCreate, ContactUpdate, ContactOut

router = APIRouter()


@router.post("/", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def create_contact(
    data: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    contact = Contact(**data.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.get("/", response_model=list[ContactOut])
def list_contacts(
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Contact)
    if current_user.role == UserRole.PORTAL:
        query = query.filter(Contact.user_id == current_user.id)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            Contact.name.ilike(search_filter) |
            Contact.email.ilike(search_filter) |
            Contact.company.ilike(search_filter)
        )
    return query.offset(skip).limit(limit).all()


@router.get("/{contact_id}", response_model=ContactOut)
def get_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    if current_user.role == UserRole.PORTAL and contact.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return contact


@router.put("/{contact_id}", response_model=ContactOut)
def update_contact(
    contact_id: int,
    data: ContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INTERNAL)),
):
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contact, field, value)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}")
def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
    return {"message": "Contact deleted"}
