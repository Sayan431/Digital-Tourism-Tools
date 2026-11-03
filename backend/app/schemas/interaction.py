from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class InteractionBase(BaseModel):
    customer_id: int
    interaction_type: str # Inquiry, Call, Email, Meeting, Support, Feedback
    subject: str
    notes: str
    outcome: Optional[str] = None

class InteractionCreate(InteractionBase):
    pass

class InteractionOut(InteractionBase):
    id: int
    organization_id: int
    user_id: Optional[int] = None
    created_at: datetime
    customer_name: Optional[str] = None

    class Config:
        from_attributes = True

