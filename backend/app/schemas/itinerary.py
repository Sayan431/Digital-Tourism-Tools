from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel

class ItineraryActivityBase(BaseModel):
    day_number: int = 1
    scheduled_time: str = "09:00 AM"
    activity_name: str
    description: Optional[str] = None
    duration: str = "3 hours"
    experience_id: Optional[int] = None
    destination_id: Optional[int] = None

class ItineraryActivityCreate(ItineraryActivityBase):
    pass

class ItineraryActivityOut(ItineraryActivityBase):
    id: int
    itinerary_id: int
    experience_title: Optional[str] = None
    destination_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ItineraryBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: date
    end_date: date
    is_custom: bool = False
    booking_id: Optional[int] = None

class ItineraryCreate(ItineraryBase):
    activities: Optional[List[ItineraryActivityCreate]] = []

class ItineraryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_custom: Optional[bool] = None

class ItineraryOut(ItineraryBase):
    id: int
    organization_id: int
    created_at: datetime
    updated_at: datetime
    activities: List[ItineraryActivityOut] = []
    booking_reference: Optional[str] = None

    class Config:
        from_attributes = True

