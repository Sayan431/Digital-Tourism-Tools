from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_tenant_org_id
from app.models.user import User
from app.models.itinerary import Itinerary, ItineraryActivity
from app.schemas.itinerary import (
    ItineraryOut,
    ItineraryCreate,
    ItineraryUpdate,
    ItineraryActivityCreate,
    ItineraryActivityOut
)

router = APIRouter(prefix="/itineraries", tags=["Itineraries"])

@router.get("", response_model=List[ItineraryOut])
def get_itineraries(
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Itinerary)
    if org_id:
        q = q.filter(Itinerary.organization_id == org_id)

    itineraries = q.order_by(desc(Itinerary.created_at)).all()
    results = []
    for itin in itineraries:
        out = ItineraryOut.from_orm(itin)
        if itin.booking:
            out.booking_reference = itin.booking.booking_reference
        
        acts_out = []
        for act in itin.activities:
            a_out = ItineraryActivityOut.from_orm(act)
            if act.experience:
                a_out.experience_title = act.experience.title
            if act.destination:
                a_out.destination_name = act.destination.name
            acts_out.append(a_out)
        out.activities = acts_out
        results.append(out)
    return results

@router.get("/{itinerary_id}", response_model=ItineraryOut)
def get_itinerary(
    itinerary_id: int,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    itin = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
    if not itin:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    if org_id and itin.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    out = ItineraryOut.from_orm(itin)
    if itin.booking:
        out.booking_reference = itin.booking.booking_reference

    acts_out = []
    for act in itin.activities:
        a_out = ItineraryActivityOut.from_orm(act)
        if act.experience:
            a_out.experience_title = act.experience.title
        if act.destination:
            a_out.destination_name = act.destination.name
        acts_out.append(a_out)
    out.activities = acts_out
    return out

@router.post("", response_model=ItineraryOut, status_code=status.HTTP_201_CREATED)
def create_itinerary(
    payload: ItineraryCreate,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    effective_org_id = org_id or current_user.organization_id
    if not effective_org_id:
        raise HTTPException(status_code=400, detail="Organization context required")

    itin_dict = payload.dict(exclude={"activities"})
    itin = Itinerary(**itin_dict, organization_id=effective_org_id)
    db.add(itin)
    db.flush()

    if payload.activities:
        for act_data in payload.activities:
            activity = ItineraryActivity(**act_data.dict(), itinerary_id=itin.id)
            db.add(activity)

    db.commit()
    db.refresh(itin)

    out = ItineraryOut.from_orm(itin)
    return out

@router.post("/{itinerary_id}/activities", response_model=ItineraryActivityOut)
def add_activity_to_itinerary(
    itinerary_id: int,
    payload: ItineraryActivityCreate,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    itin = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
    if not itin:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    if org_id and itin.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    activity = ItineraryActivity(**payload.dict(), itinerary_id=itin.id)
    db.add(activity)
    db.commit()
    db.refresh(activity)

    out = ItineraryActivityOut.from_orm(activity)
    if activity.experience:
        out.experience_title = activity.experience.title
    if activity.destination:
        out.destination_name = activity.destination.name
    return out

@router.delete("/{itinerary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_itinerary(
    itinerary_id: int,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    itin = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
    if not itin:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    if org_id and itin.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(itin)
    db.commit()
    return None

