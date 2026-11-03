from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Integer as IntColumn, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    report_type = Column(String(100), nullable=False)
    # Types: "Monthly Performance", "Revenue", "Booking", "Customer", "Tourism Experience Performance", "KPI Performance"
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    file_format = Column(String(50), default="PDF") # "PDF", "EXCEL"
    file_url = Column(String(500), nullable=True)
    file_size = Column(IntColumn, nullable=True)
    generated_by = Column(String(100), default="Admin")
    summary_data = Column(Text, nullable=True) # JSON string of key stats
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="reports")

