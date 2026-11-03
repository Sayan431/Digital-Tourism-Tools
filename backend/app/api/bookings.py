import uuid
from typing import List, Optional
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_tenant_org_id
from app.models.user import User
from app.models.booking import Booking
from app.models.experience import Experience
from app.models.customer import Customer
from app.schemas.booking import BookingOut, BookingCreate, BookingUpdate
from app.services.workflow_engine import WorkflowEngine

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.get("", response_model=List[BookingOut])
def get_bookings(
    status_filter: Optional[str] = Query(None, alias="status"),
    experience_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Booking)
    if org_id:
        q = q.filter(Booking.organization_id == org_id)
    if status_filter:
        q = q.filter(Booking.status == status_filter)
    if experience_id:
        q = q.filter(Booking.experience_id == experience_id)
    if customer_id:
        q = q.filter(Booking.customer_id == customer_id)

    bookings = q.order_by(desc(Booking.booking_date)).all()
    results = []
    for b in bookings:
        out = BookingOut.from_orm(b)
        out.customer_name = b.customer.full_name if b.customer else "Guest"
        out.customer_email = b.customer.email if b.customer else ""
        out.experience_title = b.experience.title if b.experience else "Tour"
        out.destination_name = b.experience.destination.name if b.experience and b.experience.destination else ""
        results.append(out)
    return results

@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(
    booking_id: int,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    if org_id and b.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    out = BookingOut.from_orm(b)
    out.customer_name = b.customer.full_name if b.customer else "Guest"
    out.customer_email = b.customer.email if b.customer else ""
    out.experience_title = b.experience.title if b.experience else "Tour"
    out.destination_name = b.experience.destination.name if b.experience and b.experience.destination else ""
    return out

@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    effective_org_id = org_id or current_user.organization_id
    if not effective_org_id:
        raise HTTPException(status_code=400, detail="Organization context required")

    experience = db.query(Experience).filter(Experience.id == payload.experience_id).first()
    if not experience:
        raise HTTPException(status_code=404, detail="Experience not found")

    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Availability & Overbooking Protection:
    # Sum booked participants for this experience on this date
    existing_booked_count = db.query(func.sum(Booking.participants_count)).filter(
        Booking.experience_id == payload.experience_id,
        Booking.booking_date == payload.booking_date,
        Booking.status.in_(["Confirmed", "Pending"])
    ).scalar() or 0

    if (existing_booked_count + payload.participants_count) > experience.capacity:
        remaining_slots = max(0, experience.capacity - existing_booked_count)
        raise HTTPException(
            status_code=400,
            detail=f"Overbooking prevented. Experience '{experience.title}' has capacity {experience.capacity}. Only {remaining_slots} slot(s) remaining for {payload.booking_date}."
        )

    # Unit price & total price
    unit_price = payload.unit_price if payload.unit_price is not None else experience.price
    total_price = unit_price * payload.participants_count

    # Generate booking reference
    ref_code = f"BK-{date.today().year}-{uuid.uuid4().hex[:6].upper()}"

    booking = Booking(
        booking_reference=ref_code,
        organization_id=effective_org_id,
        customer_id=payload.customer_id,
        experience_id=payload.experience_id,
        booking_date=payload.booking_date,
        booking_end_date=payload.booking_end_date or payload.booking_date,
        participants_count=payload.participants_count,
        unit_price=unit_price,
        total_price=total_price,
        status=payload.status,
        payment_status=payload.payment_status,
        special_requests=payload.special_requests,
    )
    db.add(booking)

    # Update customer lifetime spend
    if payload.status in ["Confirmed", "Completed"]:
        customer.lifetime_spend += total_price
        if customer.customer_type == "new":
            customer.customer_type = "returning"

    db.commit()
    db.refresh(booking)

    # Trigger Workflow 2: New booking confirmation notification
    WorkflowEngine.trigger_event(
        db,
        organization_id=effective_org_id,
        event_name="new_booking",
        payload={
            "booking_reference": booking.booking_reference,
            "customer_name": customer.full_name,
            "customer_email": customer.email,
            "total_price": booking.total_price,
            "experience_title": experience.title,
            "booking_date": booking.booking_date.isoformat(),
        }
    )

    out = BookingOut.from_orm(booking)
    out.customer_name = customer.full_name
    out.customer_email = customer.email
    out.experience_title = experience.title
    out.destination_name = experience.destination.name if experience.destination else ""
    return out

@router.put("/{booking_id}", response_model=BookingOut)
def update_booking(
    booking_id: int,
    payload: BookingUpdate,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    if org_id and b.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    prev_status = b.status

    for key, val in payload.dict(exclude_unset=True).items():
        setattr(b, key, val)

    # If completed, trigger Workflow 4: Feedback request
    if b.status == "Completed" and prev_status != "Completed":
        WorkflowEngine.trigger_event(
            db,
            organization_id=b.organization_id,
            event_name="completed_experience",
            payload={
                "booking_reference": b.booking_reference,
                "customer_name": b.customer.full_name if b.customer else "Guest",
                "customer_email": b.customer.email if b.customer else "",
                "experience_title": b.experience.title if b.experience else "Tour",
            }
        )

    db.commit()
    db.refresh(b)

    out = BookingOut.from_orm(b)
    out.customer_name = b.customer.full_name if b.customer else "Guest"
    out.customer_email = b.customer.email if b.customer else ""
    out.experience_title = b.experience.title if b.experience else "Tour"
    out.destination_name = b.experience.destination.name if b.experience and b.experience.destination else ""
    return out

@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_booking(
    booking_id: int,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    if org_id and b.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    b.status = "Cancelled"
    db.commit()
    return None

