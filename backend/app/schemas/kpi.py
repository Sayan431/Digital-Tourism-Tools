from typing import Optional, List, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel

class KPIDefinitionOut(BaseModel):
    id: int
    code: str
    name: str
    category: str
    unit: str
    description: Optional[str] = None
    target_type: str
    is_active: bool

    class Config:
        from_attributes = True

class KPITargetCreate(BaseModel):
    kpi_definition_id: int
    period_type: str = "monthly"
    period_identifier: str # e.g. "2026-11"
    target_value: float

class KPITargetOut(KPITargetCreate):
    id: int
    organization_id: int
    kpi_name: Optional[str] = None
    kpi_code: Optional[str] = None
    unit: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class KPIRecordCreate(BaseModel):
    kpi_definition_id: int
    period_date: date
    period_label: str
    actual_value: float
    target_value: Optional[float] = None
    growth_rate: Optional[float] = None
    notes: Optional[str] = None
    source: str = "manual_entry"

class KPIRecordOut(KPIRecordCreate):
    id: int
    organization_id: int
    kpi_name: Optional[str] = None
    kpi_code: Optional[str] = None
    unit: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class KPISummaryItem(BaseModel):
    code: str
    name: str
    category: str
    unit: str
    current_value: float
    target_value: Optional[float] = None
    achievement_rate: Optional[float] = None # percentage of target achieved
    growth_rate: Optional[float] = None # period-over-period growth %
    status: str # "on_track", "warning", "behind"
    historical: List[Dict[str, Any]] = []

class KPIDashboardResponse(BaseModel):
    period: str
    organization_id: Optional[int] = None
    organization_name: Optional[str] = None
    kpis: List[KPISummaryItem] = []

