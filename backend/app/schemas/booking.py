from typing import Optional
from datetime import datetime, date
from pydantic import BaseModel

class BookingBase(BaseModel):
    customer_id: int
    experience_id: int
    booking_date: date
    booking_end_date: Optional[date] = None
    participants_count: int = 1
    special_requests: Optional[str] = None
    status: str = "Confirmed" # Pending, Confirmed, Completed, Cancelled
    payment_status: str = "Paid" # Unpaid, Paid, Refunded

class BookingCreate(BookingBase):
    unit_price: Optional[float] = None # Will auto-fetch from Experience if not given

class BookingUpdate(BaseModel):
    booking_date: Optional[date] = None
    booking_end_date: Optional[date] = None
    participants_count: Optional[int] = None
    status: Optional[str] = None
    payment_status: Optional[str] = None
    special_requests: Optional[str] = None
    feedback_rating: Optional[float] = None
    feedback_comment: Optional[str] = None

class BookingOut(BaseModel):
    id: int
    booking_reference: str
    organization_id: int
    customer_id: int
    experience_id: int
    booking_date: date
    booking_end_date: Optional[date] = None
    participants_count: int
    unit_price: float
    total_price: float
    status: str
    payment_status: str
    special_requests: Optional[str] = None
    feedback_rating: Optional[float] = None
    feedback_comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    experience_title: Optional[str] = None
    destination_name: Optional[str] = None

    class Config:
        from_attributes = True

