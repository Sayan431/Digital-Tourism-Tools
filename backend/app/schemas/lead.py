from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

class LeadBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    inquiry_text: str
    source: str = "Website Inquiry"
    status: str = "New" # New, Contacted, Interested, Converted, Lost
    interested_category: Optional[str] = None
    interested_experience_id: Optional[int] = None
    customer_id: Optional[int] = None
    estimated_value: float = 0.0
    assigned_to: Optional[str] = None
    follow_up_date: Optional[datetime] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    inquiry_text: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    interested_category: Optional[str] = None
    interested_experience_id: Optional[int] = None
    customer_id: Optional[int] = None
    estimated_value: Optional[float] = None
    assigned_to: Optional[str] = None
    follow_up_date: Optional[datetime] = None

class LeadOut(LeadBase):
    id: int
    organization_id: int
    interested_experience_title: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

