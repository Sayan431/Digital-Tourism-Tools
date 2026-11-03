import json
from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_tenant_org_id
from app.models.user import User
from app.models.organization import Organization
from app.models.report import Report
from app.models.booking import Booking
from app.models.experience import Experience
from app.schemas.report import ReportOut, ReportCreate
from app.services.kpi_calculator import KPICalculator
from app.reporting.pdf_generator import generate_pdf_report
from app.reporting.excel_generator import generate_excel_report

router = APIRouter(prefix="/reports", tags=["Reports"])

REPORT_TYPES = [
    "Monthly Performance Report",
    "Revenue Analytics Report",
    "Booking Operations Report",
    "Customer Portfolio Report",
    "Tourism Experience Performance Report",
    "KPI Performance Target Report"
]

@router.get("/types")
def get_report_types():
    return REPORT_TYPES

@router.get("", response_model=List[ReportOut])
def get_reports(
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Report)
    if org_id:
        q = q.filter(Report.organization_id == org_id)

    reports = q.order_by(desc(Report.created_at)).all()
    results = []
    for r in reports:
        out = ReportOut.from_orm(r)
        if r.organization:
            out.organization_name = r.organization.name
        results.append(out)
    return results

@router.post("/generate", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
def generate_report_record(
    payload: ReportCreate,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    effective_org_id = org_id or current_user.organization_id
    if not effective_org_id:
        raise HTTPException(status_code=400, detail="Organization context required to generate report")

    org = db.query(Organization).filter(Organization.id == effective_org_id).first()
    metrics = KPICalculator.calculate_current_metrics(db, effective_org_id)

    # Estimate size & summary data
    summary = {
        "total_revenue": metrics["total_revenue"],
        "total_bookings": metrics["total_bookings"],
        "total_customers": metrics["total_customers"],
        "average_booking_value": metrics["average_booking_value"],
        "customer_satisfaction": metrics["customer_satisfaction"]
    }

    report = Report(
        organization_id=effective_org_id,
        title=payload.title,
        report_type=payload.report_type,
        period_start=payload.period_start,
        period_end=payload.period_end,
        file_format=payload.file_format.upper(),
        file_size=42800 if payload.file_format.upper() == "PDF" else 18500,
        generated_by=current_user.full_name,
        summary_data=json.dumps(summary)
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    out = ReportOut.from_orm(report)
    out.organization_name = org.name if org else "Tourism Client"
    return out

@router.get("/download/{report_id}")
def download_generated_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if current_user.role != "super_admin" and report.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    org = db.query(Organization).filter(Organization.id == report.organization_id).first()
    org_name = org.name if org else "Digital Tourism Business"

    # Compute live metrics and records for this org
    metrics = KPICalculator.calculate_current_metrics(db, report.organization_id)
    
    # Fetch booking records
    bookings = db.query(Booking).filter(Booking.organization_id == report.organization_id).order_by(desc(Booking.booking_date)).limit(30).all()
    booking_records = [
        {
            "ref": b.booking_reference,
            "title": b.experience.title if b.experience else "Tour",
            "customer": b.customer.full_name if b.customer else "Guest",
            "date": b.booking_date.isoformat(),
            "status": b.status,
            "amount": b.total_price,
            "participants": b.participants_count,
        }
        for b in bookings
    ]

    experiences = db.query(Experience).filter(Experience.organization_id == report.organization_id).all()
    experience_records = [
        {
            "Title": exp.title,
            "Category": exp.category,
            "Destination": exp.destination.name if exp.destination else "Global",
            "Price": exp.price,
            "Capacity": exp.capacity,
            "Rating": exp.rating,
            "Status": "Active" if exp.is_active else "Inactive"
        }
        for exp in experiences
    ]

    clean_filename = f"{report.report_type.replace(' ', '_')}_{report.period_start}_{report.period_end}"

    if report.file_format.upper() == "PDF":
        pdf_bytes = generate_pdf_report(
            report_title=report.title,
            org_name=org_name,
            period_start=report.period_start.isoformat(),
            period_end=report.period_end.isoformat(),
            metrics=metrics,
            records_data=booking_records,
            report_type=report.report_type
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{clean_filename}.pdf"'}
        )
    else:
        excel_bytes = generate_excel_report(
            report_title=report.title,
            org_name=org_name,
            period_start=report.period_start.isoformat(),
            period_end=report.period_end.isoformat(),
            metrics=metrics,
            bookings_data=booking_records,
            experiences_data=experience_records
        )
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{clean_filename}.xlsx"'}
        )

