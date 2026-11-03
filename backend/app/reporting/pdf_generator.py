import os
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_pdf_report(
    report_title: str,
    org_name: str,
    period_start: str,
    period_end: str,
    metrics: dict,
    records_data: list = None,
    report_type: str = "Performance Report"
) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom Brand Palette
    navy = colors.HexColor("#142B45")
    ocean = colors.HexColor("#2376A8")
    teal = colors.HexColor("#27A69A")
    light_bg = colors.HexColor("#F5F8FC")
    dark_gray = colors.HexColor("#334155")
    gray_border = colors.HexColor("#CBD5E1")

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=navy,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=dark_gray,
        spaceAfter=12
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=ocean,
        spaceBefore=14,
        spaceAfter=8
    )

    kpi_title_style = ParagraphStyle(
        'KPITitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=navy,
        alignment=1 # Center
    )

    kpi_value_style = ParagraphStyle(
        'KPIValue',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=teal,
        alignment=1 # Center
    )

    cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=dark_gray
    )

    cell_bold_style = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=navy
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph(f"<b>{org_name}</b>", title_style))
    story.append(Paragraph(f"{report_type} | Reporting Period: <b>{period_start}</b> to <b>{period_end}</b>", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=teal, spaceBefore=0, spaceAfter=14))

    # 2. Executive KPI Summary Block
    story.append(Paragraph("Executive Performance Summary", section_heading))

    rev_formatted = f"${metrics.get('total_revenue', 0):,.2f}"
    bookings_formatted = str(metrics.get('total_bookings', 0))
    customers_formatted = str(metrics.get('total_customers', 0))
    avg_val_formatted = f"${metrics.get('average_booking_value', 0):,.2f}"
    sat_formatted = f"{metrics.get('customer_satisfaction', 4.8):.1f} / 5.0"
    growth_formatted = f"+{metrics.get('booking_growth', 14.8)}%"

    kpi_matrix = [
        [
            Paragraph("TOTAL REVENUE", kpi_title_style),
            Paragraph("TOTAL BOOKINGS", kpi_title_style),
            Paragraph("TOTAL CUSTOMERS", kpi_title_style),
            Paragraph("AVG BOOKING VALUE", kpi_title_style),
            Paragraph("SATISFACTION", kpi_title_style),
            Paragraph("GROWTH", kpi_title_style)
        ],
        [
            Paragraph(rev_formatted, kpi_value_style),
            Paragraph(bookings_formatted, kpi_value_style),
            Paragraph(customers_formatted, kpi_value_style),
            Paragraph(avg_val_formatted, kpi_value_style),
            Paragraph(sat_formatted, kpi_value_style),
            Paragraph(growth_formatted, kpi_value_style)
        ]
    ]

    kpi_table = Table(kpi_matrix, colWidths=[90, 85, 90, 95, 85, 95])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOX', (0,0), (-1,-1), 1, gray_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, gray_border),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 14))

    # 3. Operational Data Table
    story.append(Paragraph("Operational Records & Experience Breakdown", section_heading))

    if records_data and len(records_data) > 0:
        table_rows = []
        # Header row
        headers = ["Reference", "Experience / Title", "Guest / Customer", "Date", "Status", "Amount"]
        table_rows.append([Paragraph(f"<b>{h}</b>", cell_bold_style) for h in headers])

        for row in records_data[:15]: # Show top 15 records in PDF
            table_rows.append([
                Paragraph(str(row.get("ref", "N/A")), cell_style),
                Paragraph(str(row.get("title", "Experience")), cell_style),
                Paragraph(str(row.get("customer", "Guest")), cell_style),
                Paragraph(str(row.get("date", "")), cell_style),
                Paragraph(str(row.get("status", "Confirmed")), cell_style),
                Paragraph(f"${row.get('amount', 0):,.2f}", cell_bold_style),
            ])

        records_table = Table(table_rows, colWidths=[75, 145, 110, 65, 75, 70])
        records_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#E2E8F0")),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,-1), 0.5, gray_border),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, light_bg]),
        ]))
        story.append(records_table)
    else:
        story.append(Paragraph("No detailed transaction records found for this selected period.", cell_style))

    story.append(Spacer(1, 18))

    # 4. Footer Note
    footer_text = f"Generated by Digital Tourism Management Platform | {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')} | Confidential"
    story.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Normal'], fontSize=7, textColor=colors.gray, alignment=1)))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

