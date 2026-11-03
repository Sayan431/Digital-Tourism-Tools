from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_tenant_org_id
from app.models.user import User
from app.models.customer import Customer
from app.models.interaction import CustomerInteraction
from app.schemas.interaction import InteractionOut, InteractionCreate

router = APIRouter(prefix="/interactions", tags=["Customer Interactions"])

@router.get("", response_model=List[InteractionOut])
def get_interactions(
    customer_id: Optional[int] = None,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(CustomerInteraction)
    if org_id:
        q = q.filter(CustomerInteraction.organization_id == org_id)
    if customer_id:
        q = q.filter(CustomerInteraction.customer_id == customer_id)

    ints = q.order_by(desc(CustomerInteraction.created_at)).all()
    results = []
    for i in ints:
        out = InteractionOut.from_orm(i)
        if i.customer:
            out.customer_name = i.customer.full_name
        results.append(out)
    return results

@router.post("", response_model=InteractionOut, status_code=status.HTTP_201_CREATED)
def create_interaction(
    payload: InteractionCreate,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    effective_org_id = org_id or current_user.organization_id
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    interaction = CustomerInteraction(
        organization_id=effective_org_id or customer.organization_id,
        user_id=current_user.id,
        **payload.dict()
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)

    out = InteractionOut.from_orm(interaction)
    out.customer_name = customer.full_name
    return out

