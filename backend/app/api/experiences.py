from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_tenant_org_id
from app.models.user import User
from app.models.experience import Experience
from app.models.destination import Destination
from app.schemas.experience import ExperienceOut, ExperienceCreate, ExperienceUpdate

router = APIRouter(prefix="/experiences", tags=["Tourism Experiences"])

CATEGORIES = [
    "Cultural Tourism",
    "Historical Tours",
    "Adventure Tourism",
    "Food and Culinary Experiences",
    "Nature and Wildlife",
    "City Sightseeing",
    "Beach Experiences",
    "Customized Travel Experiences",
]

@router.get("/categories")
def get_experience_categories():
    return CATEGORIES

@router.get("", response_model=List[ExperienceOut])
def get_experiences(
    category: Optional[str] = None,
    destination_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Experience)
    if org_id:
        q = q.filter(Experience.organization_id == org_id)
    if category:
        q = q.filter(Experience.category == category)
    if destination_id:
        q = q.filter(Experience.destination_id == destination_id)
    if is_active is not None:
        q = q.filter(Experience.is_active == is_active)
    if search:
        q = q.filter(Experience.title.ilike(f"%{search}%"))

    experiences = q.order_by(desc(Experience.created_at)).all()
    results = []
    for exp in experiences:
        out = ExperienceOut.from_orm(exp)
        out.destination_name = exp.destination.name if exp.destination else "Unassigned"
        out.total_bookings = len(exp.bookings)
        results.append(out)
    return results

@router.get("/{exp_id}", response_model=ExperienceOut)
def get_experience(
    exp_id: int,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exp = db.query(Experience).filter(Experience.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")
    if org_id and exp.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    out = ExperienceOut.from_orm(exp)
    out.destination_name = exp.destination.name if exp.destination else "Unassigned"
    out.total_bookings = len(exp.bookings)
    return out

@router.post("", response_model=ExperienceOut, status_code=status.HTTP_201_CREATED)
def create_experience(
    payload: ExperienceCreate,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    effective_org_id = org_id or current_user.organization_id
    if not effective_org_id:
        raise HTTPException(status_code=400, detail="Organization context required")

    destination = db.query(Destination).filter(Destination.id == payload.destination_id).first()
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found")

    experience = Experience(**payload.dict(), organization_id=effective_org_id)
    db.add(experience)
    db.commit()
    db.refresh(experience)

    out = ExperienceOut.from_orm(experience)
    out.destination_name = destination.name
    out.total_bookings = 0
    return out

@router.put("/{exp_id}", response_model=ExperienceOut)
def update_experience(
    exp_id: int,
    payload: ExperienceUpdate,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exp = db.query(Experience).filter(Experience.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")
    if org_id and exp.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    for key, val in payload.dict(exclude_unset=True).items():
        setattr(exp, key, val)

    db.commit()
    db.refresh(exp)

    out = ExperienceOut.from_orm(exp)
    out.destination_name = exp.destination.name if exp.destination else "Unassigned"
    out.total_bookings = len(exp.bookings)
    return out

@router.delete("/{exp_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experience(
    exp_id: int,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exp = db.query(Experience).filter(Experience.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")
    if org_id and exp.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Check for existing bookings
    if len(exp.bookings) > 0:
        # soft-deactivate instead of breaking historical references
        exp.is_active = False
        db.commit()
        return None

    db.delete(exp)
    db.commit()
    return None

