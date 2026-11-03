from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class KPIDefinition(Base):
    __tablename__ = "kpi_definitions"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True) # None = global default
    code = Column(String(100), nullable=False, index=True) # TOTAL_REVENUE, NUM_BOOKINGS, CUSTOMER_ACQUISITION, CONVERSION_RATE, CANCELLATION_RATE, AVG_BOOKING_VALUE, CUSTOMER_SATISFACTION, EXPERIENCE_PERFORMANCE
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False) # Financial, Operations, Customer, Marketing
    unit = Column(String(50), default="number") # currency, number, percentage, score
    description = Column(Text, nullable=True)
    target_type = Column(String(50), default="higher_is_better") # higher_is_better, lower_is_better
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    records = relationship("KPIRecord", back_populates="definition", cascade="all, delete-orphan")
    targets = relationship("KPITarget", back_populates="definition", cascade="all, delete-orphan")

class KPITarget(Base):
    __tablename__ = "kpi_targets"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    kpi_definition_id = Column(Integer, ForeignKey("kpi_definitions.id", ondelete="CASCADE"), nullable=False, index=True)
    period_type = Column(String(50), default="monthly") # monthly, quarterly, annual
    period_identifier = Column(String(50), nullable=False) # e.g. "2026-11", "2026-Q4", "2026"
    target_value = Column(Float, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="kpi_targets")
    definition = relationship("KPIDefinition", back_populates="targets")

class KPIRecord(Base):
    __tablename__ = "kpi_records"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    kpi_definition_id = Column(Integer, ForeignKey("kpi_definitions.id", ondelete="CASCADE"), nullable=False, index=True)
    period_date = Column(Date, nullable=False, index=True)
    period_label = Column(String(50), nullable=False) # e.g. "Nov 2026"
    actual_value = Column(Float, nullable=False)
    target_value = Column(Float, nullable=True)
    growth_rate = Column(Float, nullable=True) # percentage, e.g. +14.2%
    notes = Column(String(500), nullable=True)
    source = Column(String(50), default="system_calculated") # system_calculated, csv_upload, manual_entry
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="kpi_records")
    definition = relationship("KPIDefinition", back_populates="records")

