from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class ExperienceBase(BaseModel):
    title: str
    category: str
    description: str
    short_description: Optional[str] = None
    price: float
    duration_hours: float = 4.0
    duration_days: int = 1
    capacity: int = 15
    min_participants: int = 1
    image_url: Optional[str] = None
    destination_id: int
    is_active: bool = True

class ExperienceCreate(ExperienceBase):
    pass

class ExperienceUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Optional[float] = None
    duration_hours: Optional[float] = None
    duration_days: Optional[int] = None
    capacity: Optional[int] = None
    min_participants: Optional[int] = None
    image_url: Optional[str] = None
    destination_id: Optional[int] = None
    is_active: Optional[bool] = None

class ExperienceOut(ExperienceBase):
    id: int
    organization_id: int
    rating: float
    reviews_count: int
    destination_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    total_bookings: Optional[int] = 0

    class Config:
        from_attributes = True

