# Digital Tourism Management Platform (TourDesk OS)
## Full-Stack Demonstration Version

A modern, professional, responsive **Digital Tourism Management Platform** engineered to empower tourism operators, travel experience curators, and their clients to manage digital operations through a centralized, multi-tenant application.

---

### 1. Core Architecture & Requirements Matrix

This demonstration platform focuses exclusively on the five core project requirements:

| Module | Core Requirement | Key Features Implemented |
|---|---|---|
| **Module 1** | **Customized Client Dashboard** | Personalized dashboard, 7 KPI cards, revenue & booking trajectory charts, category distribution, upcoming tour departures, recent guest inquiries & activity feed. |
| **Module 2** | **KPI Collection, Integration & Visualization** | 8 predefined KPIs (Revenue, Bookings, Acquisition, Conversion, Cancellation, Avg Value, Satisfaction, Occupancy), monthly target setting, historical progression, CSV/Excel dataset import. |
| **Module 3** | **CRM & Client Workflow Automation** | Guest 360 profiles, booking history, interaction logging, lead status pipeline (`New`, `Contacted`, `Interested`, `Converted`, `Lost`), and 5 automated event-driven workflow triggers. |
| **Module 4** | **Tourism Experience Design & Management** | Full experience catalog management, 8 standardized tourism categories, multi-destination management, schedule booking with capacity verification (overbooking prevention), multi-day itinerary planner. |
| **Module 5** | **Analytics & Automated Reporting** | Revenue, booking, customer, and experience analytics; on-demand PDF report compilation (ReportLab) and multi-sheet Excel workbook export (Pandas & OpenPyXL). |

---

### 2. Technology Stack

- **Frontend**:
  - React.js (React 19)
  - Tailwind CSS (Brand palette: Deep Navy `#142B45`, Ocean Blue `#2376A8`, Teal `#27A69A`, Light `#F5F8FC`)
  - React Router
  - Recharts for interactive data visualization
  - Axios with JWT request/response interceptors
  - Lucide React for consistent UI iconography
- **Backend**:
  - Python 3.14
  - FastAPI with modular APIRouters
  - SQLAlchemy ORM with multi-tenant schema isolation (`digital_tourism`)
  - Pydantic v2 data validation schemas
  - Alembic database migration management
  - Native Bcrypt password hashing & JWT authentication (`python-jose`)
  - ReportLab for PDF report compilation
  - Pandas & OpenPyXL for multi-sheet Excel workbooks
- **Database**:
  - PostgreSQL (with automated schema management and resilient local fallback)

---

### 3. Demonstration Accounts & Roles

The system is pre-populated with realistic demonstration data for two tourism organizations and three user roles:

| Role | Account Name | Organization | Email | Password | Scope |
|---|---|---|---|---|---|
| **Super Admin** | Alexander Wright | Platform-Wide | `superadmin@tourismplatform.com` | `SuperAdmin123!` | Complete platform governance, organization onboarding, admin account management, global analytics. |
| **Admin** | Marcus Sterling | Alpine & Azure Expeditions | `admin@alpineexpeditions.com` | `AlpineAdmin123!` | Organization-specific dashboard, high-altitude alpine treks, guest CRM, booking management, PDF reports. |
| **Admin** | Dr. Julian Ross | Heritage & Horizon Journeys | `admin@heritagehorizon.com` | `HeritageAdmin123!` | Organization-specific dashboard, cultural heritage & historical tours in Kyoto & Greece, Mediterranean CRM. |

> **Quick Login Tip**: The login screen features one-click demonstration login buttons to immediately sign in as any of the three roles without typing credentials.

---

### 4. Five Core Automated Workflows (Module 3)

The automated workflow engine implements 5 functional triggers:
1. **New Customer Inquiry** &rarr; Automatically creates a CRM record, logs an interaction, and dispatches a staff notification alert.
2. **New Booking Confirmation** &rarr; Calculates pricing, updates guest lifetime spend, and generates an automated confirmation voucher.
3. **Upcoming Experience Reminder** &rarr; Dispatches pre-departure operational reminders to guides and guests.
4. **Completed Experience Feedback Request** &rarr; Dispatches digital satisfaction surveys to collect ratings and reviews.
5. **Unanswered Inquiry SLA Alert** &rarr; Flags pending inquiries exceeding response limits and creates high-priority follow-up tasks.

*Administrators can enable/disable workflows, view execution logs, or use the **Test Trigger** console to manually execute any workflow.*

---

### 5. Project Directory Structure

```text
Digital Tourism Tools/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI modular endpoints
│   │   │   ├── auth.py
│   │   │   ├── organizations.py
│   │   │   ├── users.py
│   │   │   ├── dashboard.py
│   │   │   ├── kpis.py
│   │   │   ├── customers.py
│   │   │   ├── leads.py
│   │   │   ├── interactions.py
│   │   │   ├── destinations.py
│   │   │   ├── experiences.py
│   │   │   ├── bookings.py
│   │   │   ├── itineraries.py
│   │   │   ├── workflows.py
│   │   │   ├── analytics.py
│   │   │   ├── reports.py
│   │   │   └── notifications.py
│   │   ├── core/            # Configuration, database engine, security
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   ├── security.py
│   │   │   └── dependencies.py
│   │   ├── models/          # 17 SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── services/        # Workflow engine, KPI calculator, Data import
│   │   ├── reporting/       # PDF and Excel report compilation
│   │   ├── utils/           # Database seeding script with realistic data
│   │   └── main.py          # FastAPI application entrypoint
│   ├── alembic/             # Database migration versions
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client with interceptors
│   │   ├── context/         # AuthContext & ToastContext
│   │   ├── components/      # Sidebar, TopNav, Layout, StatCard, Modal
│   │   ├── pages/           # Dashboard, KPIs, CRM, Experiences, Bookings, Workflows, Reports, Orgs, Settings
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

### 6. Installation & Execution Guide

#### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Verify `.env` configuration**:
   Ensure `backend/.env` contains your PostgreSQL connection string:
   ```env
   DATABASE_URL=postgresql+psycopg2://user:password@host:5432/dbname?sslmode=require
   DB_SCHEMA=digital_tourism
   SECRET_KEY=digital-tourism-management-secret-key-super-secure-2026-production
   ```

4. **Seed the database with sample demonstration data**:
   ```bash
   python -c "import sys; sys.path.insert(0, '.'); from app.utils.seed_data import seed_database; seed_database()"
   ```

5. **Start the FastAPI backend server**:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - API Root: `http://127.0.0.1:8000/`
   - Interactive Swagger API Documentation: `http://127.0.0.1:8000/api/docs`

#### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node packages**:
   ```bash
   npm install
   ```

3. **Run the Vite development server**:
   ```bash
   npm run dev
   ```
   - Application URL: `http://localhost:5173`

---

### 7. Verification Checklist

- [x] **PostgreSQL Database Integration**: 17 SQLAlchemy tables created under `digital_tourism` schema with Alembic migration version.
- [x] **Authentication & Role Separation**: JWT authentication, bcrypt passwords, Super Admin and Admin data scope isolation.
- [x] **Personalized Dashboard (Module 1)**: Live KPI summary cards, revenue/booking trajectories, category revenue distribution, upcoming tours.
- [x] **KPI System (Module 2)**: 8 core KPIs calculated dynamically from database records, targets comparison, historical tracking, CSV/Excel import.
- [x] **CRM & Workflows (Module 3)**: Customer 360 profile, interaction history, lead status pipeline, 5 automated triggers with audit log.
- [x] **Tourism Experiences (Module 4)**: Experience catalog across 8 categories, destination manager, overbooking prevention, itinerary builder.
- [x] **Automated Reporting (Module 5)**: Real-time report generator compiling downloadable PDF documents and Excel spreadsheets.

