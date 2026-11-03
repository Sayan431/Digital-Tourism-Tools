from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_tenant_org_id
from app.models.user import User
from app.models.organization import Organization
from app.models.kpi import KPIDefinition, KPITarget, KPIRecord
from app.schemas.kpi import (
    KPIDefinitionOut,
    KPITargetCreate,
    KPITargetOut,
    KPIRecordCreate,
    KPIRecordOut,
    KPIDashboardResponse
)
from app.services.kpi_calculator import KPICalculator
from app.services.data_import import DataImportService

router = APIRouter(prefix="/kpis", tags=["KPIs"])

@router.get("/summary", response_model=KPIDashboardResponse)
def get_kpi_summary(
    period: str = Query("2026-11", description="Period format YYYY-MM"),
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_name = None
    if org_id:
        org = db.query(Organization).filter(Organization.id == org_id).first()
        if org:
            org_name = org.name
    elif current_user.role == "super_admin":
        org_name = "Platform-wide Aggregated"

    summary_items = KPICalculator.get_kpi_dashboard_summary(db, org_id, period)

    return KPIDashboardResponse(
        period=period,
        organization_id=org_id,
        organization_name=org_name,
        kpis=summary_items
    )

@router.get("/definitions", response_model=List[KPIDefinitionOut])
def get_kpi_definitions(db: Session = Depends(get_db)):
    return db.query(KPIDefinition).filter(KPIDefinition.is_active == True).all()

@router.get("/targets", response_model=List[KPITargetOut])
def get_kpi_targets(
    period: Optional[str] = None,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(KPITarget)
    if org_id:
        q = q.filter(KPITarget.organization_id == org_id)
    if period:
        q = q.filter(KPITarget.period_identifier == period)
    
    targets = q.all()
    results = []
    for t in targets:
        out = KPITargetOut.from_orm(t)
        if t.definition:
            out.kpi_name = t.definition.name
            out.kpi_code = t.definition.code
            out.unit = t.definition.unit
        results.append(out)
    return results

@router.post("/targets", response_model=KPITargetOut, status_code=status.HTTP_201_CREATED)
def set_kpi_target(
    payload: KPITargetCreate,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    effective_org_id = org_id or current_user.organization_id
    if not effective_org_id:
        raise HTTPException(status_code=400, detail="Target requires a specific organization context")

    # Update if already exists for this period, else create
    target = db.query(KPITarget).filter(
        KPITarget.organization_id == effective_org_id,
        KPITarget.kpi_definition_id == payload.kpi_definition_id,
        KPITarget.period_identifier == payload.period_identifier
    ).first()

    if target:
        target.target_value = payload.target_value
        target.period_type = payload.period_type
    else:
        target = KPITarget(
            organization_id=effective_org_id,
            kpi_definition_id=payload.kpi_definition_id,
            period_type=payload.period_type,
            period_identifier=payload.period_identifier,
            target_value=payload.target_value
        )
        db.add(target)

    db.commit()
    db.refresh(target)

    out = KPITargetOut.from_orm(target)
    if target.definition:
        out.kpi_name = target.definition.name
        out.kpi_code = target.definition.code
        out.unit = target.definition.unit
    return out

@router.get("/records", response_model=List[KPIRecordOut])
def get_kpi_records(
    kpi_code: Optional[str] = None,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(KPIRecord)
    if org_id:
        q = q.filter(KPIRecord.organization_id == org_id)
    if kpi_code:
        defn = db.query(KPIDefinition).filter(KPIDefinition.code == kpi_code).first()
        if defn:
            q = q.filter(KPIRecord.kpi_definition_id == defn.id)

    records = q.order_by(KPIRecord.period_date.desc()).all()
    results = []
    for r in records:
        out = KPIRecordOut.from_orm(r)
        if r.definition:
            out.kpi_name = r.definition.name
            out.kpi_code = r.definition.code
            out.unit = r.definition.unit
        results.append(out)
    return results

@router.post("/records", response_model=KPIRecordOut, status_code=status.HTTP_201_CREATED)
def create_kpi_record(
    payload: KPIRecordCreate,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    effective_org_id = org_id or current_user.organization_id
    if not effective_org_id:
        raise HTTPException(status_code=400, detail="Record requires a specific organization context")

    rec = KPIRecord(**payload.dict(), organization_id=effective_org_id)
    db.add(rec)
    db.commit()
    db.refresh(rec)

    out = KPIRecordOut.from_orm(rec)
    if rec.definition:
        out.kpi_name = rec.definition.name
        out.kpi_code = rec.definition.code
        out.unit = rec.definition.unit
    return out

@router.post("/import")
async def import_kpi_file(
    file: UploadFile = File(...),
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    effective_org_id = org_id or current_user.organization_id
    if not effective_org_id:
        raise HTTPException(status_code=400, detail="Import requires a specific organization context")

    content = await file.read()
    result = DataImportService.import_kpi_records(db, effective_org_id, content, file.filename)
    return {"message": f"Successfully imported {result['imported']} KPI records", "details": result}

