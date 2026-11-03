from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_tenant_org_id
from app.models.user import User
from app.models.customer import Customer
from app.models.booking import Booking
from app.models.interaction import CustomerInteraction
from app.schemas.customer import CustomerOut, CustomerCreate, CustomerUpdate
from app.schemas.booking import BookingOut
from app.schemas.interaction import InteractionOut
from app.services.data_import import DataImportService

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("", response_model=List[CustomerOut])
def get_customers(
    search: Optional[str] = None,
    customer_type: Optional[str] = None,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Customer)
    if org_id:
        q = q.filter(Customer.organization_id == org_id)
    if customer_type:
        q = q.filter(Customer.customer_type == customer_type)
    if search:
        search_fmt = f"%{search}%"
        q = q.filter(
            or_(
                Customer.first_name.ilike(search_fmt),
                Customer.last_name.ilike(search_fmt),
                Customer.email.ilike(search_fmt),
                Customer.country.ilike(search_fmt),
            )
        )
    
    customers = q.order_by(desc(Customer.created_at)).all()
    results = []
    for c in customers:
        out = CustomerOut.from_orm(c)
        out.full_name = c.full_name
        out.total_bookings = len(c.bookings)
        results.append(out)
    return results

@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer_profile(
    customer_id: int,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    if org_id and c.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this customer")

    out = CustomerOut.from_orm(c)
    out.full_name = c.full_name
    out.total_bookings = len(c.bookings)
    return out

@router.get("/{customer_id}/bookings", response_model=List[BookingOut])
def get_customer_bookings(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bookings = db.query(Booking).filter(Booking.customer_id == customer_id).order_by(desc(Booking.booking_date)).all()
    results = []
    for b in bookings:
        out = BookingOut.from_orm(b)
        out.customer_name = b.customer.full_name if b.customer else "Guest"
        out.customer_email = b.customer.email if b.customer else ""
        out.experience_title = b.experience.title if b.experience else "Tour"
        out.destination_name = b.experience.destination.name if b.experience and b.experience.destination else ""
        results.append(out)
    return results

@router.get("/{customer_id}/interactions", response_model=List[InteractionOut])
def get_customer_interactions(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ints = db.query(CustomerInteraction).filter(CustomerInteraction.customer_id == customer_id).order_by(desc(CustomerInteraction.created_at)).all()
    results = []
    for i in ints:
        out = InteractionOut.from_orm(i)
        out.customer_name = i.customer.full_name if i.customer else ""
        results.append(out)
    return results

@router.post("", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    effective_org_id = org_id or current_user.organization_id
    if not effective_org_id:
        raise HTTPException(status_code=400, detail="Creating customer requires an organization context")

    existing = db.query(Customer).filter(
        Customer.organization_id == effective_org_id,
        Customer.email == payload.email
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this email already exists in this organization")

    customer = Customer(**payload.dict(), organization_id=effective_org_id)
    db.add(customer)
    db.commit()
    db.refresh(customer)

    out = CustomerOut.from_orm(customer)
    out.full_name = customer.full_name
    out.total_bookings = 0
    return out

@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    if org_id and c.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this customer")

    for key, val in payload.dict(exclude_unset=True).items():
        setattr(c, key, val)

    db.commit()
    db.refresh(c)

    out = CustomerOut.from_orm(c)
    out.full_name = c.full_name
    out.total_bookings = len(c.bookings)
    return out

@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: int,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    if org_id and c.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this customer")

    db.delete(c)
    db.commit()
    return None

@router.post("/import")
async def import_customers_file(
    file: UploadFile = File(...),
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    effective_org_id = org_id or current_user.organization_id
    if not effective_org_id:
        raise HTTPException(status_code=400, detail="Import requires an organization context")

    content = await file.read()
    result = DataImportService.import_customers(db, effective_org_id, content, file.filename)
    return {"message": f"Successfully imported {result['imported']} customers ({result['skipped']} skipped)", "details": result}

