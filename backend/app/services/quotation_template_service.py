from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.quotation_template import QuotationTemplate, QuotationTemplateLine
from app.schemas.quotation_template import QuotationTemplateCreate, QuotationTemplateUpdate


def create_template(db: Session, data: QuotationTemplateCreate) -> QuotationTemplate:
    template = QuotationTemplate(
        name=data.name,
        validity_days=data.validity_days,
        recurring_plan_id=data.recurring_plan_id,
    )
    db.add(template)
    db.flush()

    for line_data in data.lines:
        line = QuotationTemplateLine(
            template_id=template.id,
            product_id=line_data.product_id,
            quantity=line_data.quantity,
            unit_price=line_data.unit_price,
        )
        db.add(line)

    db.commit()
    db.refresh(template)
    return template


def get_templates(db: Session, skip: int = 0, limit: int = 100) -> list[QuotationTemplate]:
    return db.query(QuotationTemplate).offset(skip).limit(limit).all()


def get_template(db: Session, template_id: int) -> QuotationTemplate:
    template = db.query(QuotationTemplate).filter(QuotationTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Quotation template not found")
    return template


def update_template(db: Session, template_id: int, data: QuotationTemplateUpdate) -> QuotationTemplate:
    template = get_template(db, template_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)
    db.commit()
    db.refresh(template)
    return template


def delete_template(db: Session, template_id: int):
    template = get_template(db, template_id)
    db.delete(template)
    db.commit()
