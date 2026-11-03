import io
from datetime import datetime
import pandas as pd
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def generate_excel_report(
    report_title: str,
    org_name: str,
    period_start: str,
    period_end: str,
    metrics: dict,
    bookings_data: list = None,
    experiences_data: list = None
) -> bytes:
    output = io.BytesIO()
    
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        # Sheet 1: Executive Summary
        summary_rows = [
            {"Metric": "Organization", "Value": org_name},
            {"Metric": "Report Type", "Value": report_title},
            {"Metric": "Period Start", "Value": period_start},
            {"Metric": "Period End", "Value": period_end},
            {"Metric": "Generated On", "Value": datetime.now().strftime("%Y-%m-%d %H:%M:%S")},
            {"Metric": "---", "Value": "---"},
            {"Metric": "Total Revenue (USD)", "Value": metrics.get("total_revenue", 0)},
            {"Metric": "Total Bookings", "Value": metrics.get("total_bookings", 0)},
            {"Metric": "Confirmed / Completed Bookings", "Value": metrics.get("confirmed_bookings", 0)},
            {"Metric": "Total Customers", "Value": metrics.get("total_customers", 0)},
            {"Metric": "Active Experiences", "Value": metrics.get("active_experiences", 0)},
            {"Metric": "Average Booking Value (USD)", "Value": metrics.get("average_booking_value", 0)},
            {"Metric": "Cancellation Rate (%)", "Value": metrics.get("cancellation_rate", 0)},
            {"Metric": "Customer Satisfaction (1-5)", "Value": metrics.get("customer_satisfaction", 5.0)},
            {"Metric": "Booking Conversion Rate (%)", "Value": metrics.get("conversion_rate", 0)},
        ]
        df_summary = pd.DataFrame(summary_rows)
        df_summary.to_excel(writer, sheet_name="Executive Summary", index=False)

        # Sheet 2: Bookings
        if bookings_data:
            df_bookings = pd.DataFrame(bookings_data)
        else:
            df_bookings = pd.DataFrame(columns=["Reference", "Customer", "Experience", "Date", "Participants", "Status", "Total Price"])
        df_bookings.to_excel(writer, sheet_name="Bookings Data", index=False)

        # Sheet 3: Experiences
        if experiences_data:
            df_exp = pd.DataFrame(experiences_data)
        else:
            df_exp = pd.DataFrame(columns=["Title", "Category", "Destination", "Price", "Capacity", "Rating", "Status"])
        df_exp.to_excel(writer, sheet_name="Tourism Experiences", index=False)

        # Style Worksheets
        wb = writer.book
        header_fill = PatternFill(start_color="142B45", end_color="142B45", fill_type="solid")
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        border = Border(
            left=Side(style='thin', color='CBD5E1'),
            right=Side(style='thin', color='CBD5E1'),
            top=Side(style='thin', color='CBD5E1'),
            bottom=Side(style='thin', color='CBD5E1')
        )

        for sheet in wb.worksheets:
            # Header styling
            for col_idx in range(1, sheet.max_column + 1):
                cell = sheet.cell(row=1, column=col_idx)
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal="center", vertical="center")

            # Column auto-width & grid borders
            for col in sheet.columns:
                max_len = 0
                col_letter = get_column_letter(col[0].column)
                for cell in col:
                    cell.border = border
                    val_str = str(cell.value or "")
                    if len(val_str) > max_len:
                        max_len = len(val_str)
                sheet.column_dimensions[col_letter].width = max(max_len + 4, 14)

    excel_bytes = output.getvalue()
    output.close()
    return excel_bytes

