from typing import Optional, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel

class ReportCreate(BaseModel):
    title: str
    report_type: str # "Monthly Performance", "Revenue", "Booking", "Customer", "Tourism Experience Performance", "KPI Performance"
    period_start: date
    period_end: date
    file_format: str = "PDF" # "PDF", "EXCEL"

class ReportOut(BaseModel):
    id: int
    organization_id: int
    title: str
    report_type: str
    period_start: date
    period_end: date
    file_format: str
    file_url: Optional[str] = None
    file_size: Optional[int] = None
    generated_by: str
    summary_data: Optional[str] = None
    created_at: datetime
    organization_name: Optional[str] = None

    class Config:
        from_attributes = True

