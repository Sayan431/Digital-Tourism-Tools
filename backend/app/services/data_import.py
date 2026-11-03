import io
from datetime import datetime, date
import pandas as pd
from sqlalchemy.orm import Session
from app.models.customer import Customer
from app.models.kpi import KPIDefinition, KPIRecord

class DataImportService:
    """
    Parses CSV and Excel uploads for customer lists and external KPI performance entries.
    """

    @staticmethod
    def import_customers(db: Session, organization_id: int, file_bytes: bytes, filename: str) -> dict:
        is_excel = filename.endswith((".xlsx", ".xls"))
        
        if is_excel:
            df = pd.read_excel(io.BytesIO(file_bytes))
        else:
            df = pd.read_csv(io.BytesIO(file_bytes))

        imported_count = 0
        skipped_count = 0

        for _, row in df.iterrows():
            email = str(row.get("email", "")).strip()
            first_name = str(row.get("first_name", "")).strip() or str(row.get("name", "Guest")).split()[0]
            last_name = str(row.get("last_name", "")).strip() or "Client"
            
            if not email or "@" not in email:
                skipped_count += 1
                continue

            existing = db.query(Customer).filter(
                Customer.organization_id == organization_id,
                Customer.email == email
            ).first()

            if existing:
                skipped_count += 1
                continue

            cust = Customer(
                organization_id=organization_id,
                first_name=first_name,
                last_name=last_name,
                email=email,
                phone=str(row.get("phone", "")) if pd.notna(row.get("phone")) else None,
                country=str(row.get("country", "United States")),
                customer_type="new",
                satisfaction_score=float(row.get("satisfaction_score", 5.0)) if pd.notna(row.get("satisfaction_score")) else 5.0,
            )
            db.add(cust)
            imported_count += 1

        db.commit()
        return {"imported": imported_count, "skipped": skipped_count}

    @staticmethod
    def import_kpi_records(db: Session, organization_id: int, file_bytes: bytes, filename: str) -> dict:
        is_excel = filename.endswith((".xlsx", ".xls"))
        
        if is_excel:
            df = pd.read_excel(io.BytesIO(file_bytes))
        else:
            df = pd.read_csv(io.BytesIO(file_bytes))

        imported_count = 0
        for _, row in df.iterrows():
            code = str(row.get("kpi_code", "")).strip().upper()
            defn = db.query(KPIDefinition).filter(KPIDefinition.code == code).first()
            if not defn:
                continue

            period_date_val = row.get("period_date")
            if pd.isna(period_date_val):
                p_date = date.today()
            elif isinstance(period_date_val, str):
                p_date = datetime.strptime(period_date_val[:10], "%Y-%m-%d").date()
            else:
                p_date = period_date_val.date() if hasattr(period_date_val, 'date') else date.today()

            rec = KPIRecord(
                organization_id=organization_id,
                kpi_definition_id=defn.id,
                period_date=p_date,
                period_label=str(row.get("period_label", p_date.strftime("%b %Y"))),
                actual_value=float(row.get("actual_value", 0.0)),
                target_value=float(row.get("target_value", 0.0)) if pd.notna(row.get("target_value")) else None,
                growth_rate=float(row.get("growth_rate", 0.0)) if pd.notna(row.get("growth_rate")) else None,
                notes=str(row.get("notes", "Imported via dataset")),
                source="csv_upload"
            )
            db.add(rec)
            imported_count += 1

        db.commit()
        return {"imported": imported_count}

