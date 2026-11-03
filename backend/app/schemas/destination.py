from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class DestinationBase(BaseModel):
    name: str
    country: str
    region: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    climate: Optional[str] = None
    best_season: Optional[str] = None
    is_featured: bool = False

class DestinationCreate(DestinationBase):
    pass

class DestinationUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    climate: Optional[str] = None
    best_season: Optional[str] = None
    is_featured: Optional[bool] = None

class DestinationOut(DestinationBase):
    id: int
    organization_id: int
    created_at: datetime
    updated_at: datetime
    experiences_count: Optional[int] = 0

    class Config:
        from_attributes = True

