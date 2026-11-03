from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_tenant_org_id
from app.models.user import User
from app.models.lead import Lead
from app.models.customer import Customer
from app.schemas.lead import LeadOut, LeadCreate, LeadUpdate
from app.services.workflow_engine import WorkflowEngine

router = APIRouter(prefix="/leads", tags=["Leads & Inquiries"])

@router.get("", response_model=List[LeadOut])
def get_leads(
    status_filter: Optional[str] = Query(None, alias="status"),
    source_filter: Optional[str] = Query(None, alias="source"),
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Lead)
    if org_id:
        q = q.filter(Lead.organization_id == org_id)
    if status_filter:
        q = q.filter(Lead.status == status_filter)
    if source_filter:
        q = q.filter(Lead.source == source_filter)

    leads = q.order_by(desc(Lead.created_at)).all()
    results = []
    for l in leads:
        out = LeadOut.from_orm(l)
        if l.interested_experience:
            out.interested_experience_title = l.interested_experience.title
        results.append(out)
    return results

@router.post("", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
def create_lead(
    payload: LeadCreate,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    effective_org_id = org_id or current_user.organization_id
    if not effective_org_id:
        raise HTTPException(status_code=400, detail="Organization context required")

    lead = Lead(**payload.dict(), organization_id=effective_org_id)
    db.add(lead)
    db.commit()
    db.refresh(lead)

    # Trigger Workflow 1: New customer inquiry -> Automatically create a CRM record & alert
    WorkflowEngine.trigger_event(
        db,
        organization_id=effective_org_id,
        event_name="new_inquiry",
        payload={
            "name": lead.name,
            "email": lead.email,
            "inquiry_text": lead.inquiry_text,
            "source": lead.source
        }
    )

    out = LeadOut.from_orm(lead)
    if lead.interested_experience:
        out.interested_experience_title = lead.interested_experience.title
    return out

@router.put("/{lead_id}", response_model=LeadOut)
def update_lead(
    lead_id: int,
    payload: LeadUpdate,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if org_id and lead.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this lead")

    prev_status = lead.status

    for key, val in payload.dict(exclude_unset=True).items():
        setattr(lead, key, val)

    # If converted and not yet converted to a Customer, optionally create Customer record
    if lead.status == "Converted" and prev_status != "Converted" and not lead.customer_id:
        existing_cust = db.query(Customer).filter(
            Customer.organization_id == lead.organization_id,
            Customer.email == lead.email
        ).first()
        if not existing_cust:
            name_parts = lead.name.split(" ", 1)
            fname = name_parts[0]
            lname = name_parts[1] if len(name_parts) > 1 else "Guest"
            new_cust = Customer(
                organization_id=lead.organization_id,
                first_name=fname,
                last_name=lname,
                email=lead.email,
                phone=lead.phone,
                customer_type="new",
                internal_notes=f"Converted from lead on {datetime.now().strftime('%Y-%m-%d')}. Original inquiry: {lead.inquiry_text}"
            )
            db.add(new_cust)
            db.commit()
            db.refresh(new_cust)
            lead.customer_id = new_cust.id

    db.commit()
    db.refresh(lead)

    out = LeadOut.from_orm(lead)
    if lead.interested_experience:
        out.interested_experience_title = lead.interested_experience.title
    return out

@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(
    lead_id: int,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if org_id and lead.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(lead)
    db.commit()
    return None

