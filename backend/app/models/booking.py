from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(String(50), unique=True, index=True, nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    experience_id = Column(Integer, ForeignKey("experiences.id", ondelete="RESTRICT"), nullable=False, index=True)
    booking_date = Column(Date, nullable=False)
    booking_end_date = Column(Date, nullable=True)
    participants_count = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(String(50), default="Confirmed", index=True) # Pending, Confirmed, Completed, Cancelled
    payment_status = Column(String(50), default="Paid") # Unpaid, Paid, Refunded
    special_requests = Column(Text, nullable=True)
    feedback_rating = Column(Float, nullable=True)
    feedback_comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="bookings")
    customer = relationship("Customer", back_populates="bookings")
    experience = relationship("Experience", back_populates="bookings")
    itinerary = relationship("Itinerary", back_populates="booking", uselist=False)

