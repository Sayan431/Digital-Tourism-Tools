from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    inquiry_text = Column(Text, nullable=False)
    source = Column(String(100), default="Website Inquiry") # Website Inquiry, Travel Agent Referral, Social Media, etc.
    status = Column(String(50), default="New", index=True) # New, Contacted, Interested, Converted, Lost
    interested_category = Column(String(100), nullable=True)
    interested_experience_id = Column(Integer, ForeignKey("experiences.id", ondelete="SET NULL"), nullable=True)
    estimated_value = Column(Float, default=0.0)
    assigned_to = Column(String(100), nullable=True)
    follow_up_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="leads")
    customer = relationship("Customer", back_populates="leads")
    interested_experience = relationship("Experience")

