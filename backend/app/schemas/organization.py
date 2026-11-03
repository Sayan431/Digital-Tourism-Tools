from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

class OrganizationBase(BaseModel):
    name: str
    slug: str
    logo_url: Optional[str] = None
    primary_color: str = "#142B45"
    secondary_color: str = "#2376A8"
    email: EmailStr
    phone: Optional[str] = None
    website: Optional[str] = None
    currency: str = "USD"
    description: Optional[str] = None
    is_active: bool = True

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class OrganizationOut(OrganizationBase):
    id: int
    created_at: datetime
    updated_at: datetime
    total_customers: Optional[int] = 0
    total_experiences: Optional[int] = 0
    total_bookings: Optional[int] = 0

    class Config:
        from_attributes = True

