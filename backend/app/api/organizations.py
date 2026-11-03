from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_super_admin
from app.models.user import User
from app.models.organization import Organization
from app.models.customer import Customer
from app.models.experience import Experience
from app.models.booking import Booking
from app.schemas.organization import OrganizationOut, OrganizationCreate, OrganizationUpdate

router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.get("", response_model=List[OrganizationOut])
def get_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "super_admin":
        orgs = db.query(Organization).all()
    else:
        orgs = db.query(Organization).filter(Organization.id == current_user.organization_id).all()

    result = []
    for org in orgs:
        out = OrganizationOut.from_orm(org)
        out.total_customers = db.query(Customer).filter(Customer.organization_id == org.id).count()
        out.total_experiences = db.query(Experience).filter(Experience.organization_id == org.id).count()
        out.total_bookings = db.query(Booking).filter(Booking.organization_id == org.id).count()
        result.append(out)
    return result

@router.get("/{org_id}", response_model=OrganizationOut)
def get_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "super_admin" and current_user.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this organization")
    
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    out = OrganizationOut.from_orm(org)
    out.total_customers = db.query(Customer).filter(Customer.organization_id == org.id).count()
    out.total_experiences = db.query(Experience).filter(Experience.organization_id == org.id).count()
    out.total_bookings = db.query(Booking).filter(Booking.organization_id == org.id).count()
    return out

@router.post("", response_model=OrganizationOut, status_code=status.HTTP_201_CREATED)
def create_organization(
    payload: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    existing = db.query(Organization).filter(Organization.slug == payload.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Organization slug already exists")
    
    org = Organization(**payload.dict())
    db.add(org)
    db.commit()
    db.refresh(org)
    return org

@router.put("/{org_id}", response_model=OrganizationOut)
def update_organization(
    org_id: int,
    payload: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "super_admin" and current_user.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this organization")
    
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    for key, val in payload.dict(exclude_unset=True).items():
        setattr(org, key, val)
    
    db.commit()
    db.refresh(org)
    return org

