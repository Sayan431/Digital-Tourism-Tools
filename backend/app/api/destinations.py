from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_tenant_org_id
from app.models.user import User
from app.models.destination import Destination
from app.schemas.destination import DestinationOut, DestinationCreate, DestinationUpdate

router = APIRouter(prefix="/destinations", tags=["Destinations"])

@router.get("", response_model=List[DestinationOut])
def get_destinations(
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Destination)
    if org_id:
        q = q.filter(Destination.organization_id == org_id)

    destinations = q.order_by(desc(Destination.created_at)).all()
    results = []
    for d in destinations:
        out = DestinationOut.from_orm(d)
        out.experiences_count = len(d.experiences)
        results.append(out)
    return results

@router.get("/{dest_id}", response_model=DestinationOut)
def get_destination(
    dest_id: int,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    d = db.query(Destination).filter(Destination.id == dest_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Destination not found")
    if org_id and d.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    out = DestinationOut.from_orm(d)
    out.experiences_count = len(d.experiences)
    return out

@router.post("", response_model=DestinationOut, status_code=status.HTTP_201_CREATED)
def create_destination(
    payload: DestinationCreate,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    effective_org_id = org_id or current_user.organization_id
    if not effective_org_id:
        raise HTTPException(status_code=400, detail="Organization context required")

    destination = Destination(**payload.dict(), organization_id=effective_org_id)
    db.add(destination)
    db.commit()
    db.refresh(destination)

    out = DestinationOut.from_orm(destination)
    out.experiences_count = 0
    return out

@router.put("/{dest_id}", response_model=DestinationOut)
def update_destination(
    dest_id: int,
    payload: DestinationUpdate,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    d = db.query(Destination).filter(Destination.id == dest_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Destination not found")
    if org_id and d.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    for key, val in payload.dict(exclude_unset=True).items():
        setattr(d, key, val)

    db.commit()
    db.refresh(d)

    out = DestinationOut.from_orm(d)
    out.experiences_count = len(d.experiences)
    return out

@router.delete("/{dest_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_destination(
    dest_id: int,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    d = db.query(Destination).filter(Destination.id == dest_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Destination not found")
    if org_id and d.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if len(d.experiences) > 0:
        raise HTTPException(status_code=400, detail="Cannot delete destination with associated experiences. Reassign or delete them first.")

    db.delete(d)
    db.commit()
    return None

