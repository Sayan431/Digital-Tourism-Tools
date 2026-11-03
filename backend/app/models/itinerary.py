from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Itinerary(Base):
    __tablename__ = "itineraries"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, unique=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_custom = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="itineraries")
    booking = relationship("Booking", back_populates="itinerary")
    activities = relationship("ItineraryActivity", back_populates="itinerary", cascade="all, delete-orphan", order_by="ItineraryActivity.day_number")

class ItineraryActivity(Base):
    __tablename__ = "itinerary_activities"

    id = Column(Integer, primary_key=True, index=True)
    itinerary_id = Column(Integer, ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False, index=True)
    experience_id = Column(Integer, ForeignKey("experiences.id", ondelete="SET NULL"), nullable=True)
    destination_id = Column(Integer, ForeignKey("destinations.id", ondelete="SET NULL"), nullable=True)
    day_number = Column(Integer, default=1)
    scheduled_time = Column(String(50), default="09:00 AM")
    activity_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    duration = Column(String(50), default="3 hours")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    itinerary = relationship("Itinerary", back_populates="activities")
    experience = relationship("Experience")
    destination = relationship("Destination")

