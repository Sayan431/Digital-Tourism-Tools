from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Experience(Base):
    __tablename__ = "experiences"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    destination_id = Column(Integer, ForeignKey("destinations.id", ondelete="RESTRICT"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    short_description = Column(String(500), nullable=True)
    price = Column(Float, nullable=False)
    duration_hours = Column(Float, default=4.0)
    duration_days = Column(Integer, default=1)
    capacity = Column(Integer, nullable=False, default=15)
    min_participants = Column(Integer, default=1)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    rating = Column(Float, default=4.8)
    reviews_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="experiences")
    destination = relationship("Destination", back_populates="experiences")
    bookings = relationship("Booking", back_populates="experience")

