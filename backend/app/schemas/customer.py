from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr

class CustomerBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    country: str = "United States"
    address: Optional[str] = None
    preferences: Optional[str] = None
    internal_notes: Optional[str] = None
    customer_type: str = "new"
    satisfaction_score: Optional[float] = 5.0

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    address: Optional[str] = None
    preferences: Optional[str] = None
    internal_notes: Optional[str] = None
    customer_type: Optional[str] = None
    satisfaction_score: Optional[float] = None

class CustomerOut(CustomerBase):
    id: int
    organization_id: int
    full_name: str
    lifetime_spend: float
    total_bookings: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

