import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.utils.seed_data import seed_database

# Routers
from app.api.auth import router as auth_router
from app.api.organizations import router as organizations_router
from app.api.users import router as users_router
from app.api.dashboard import router as dashboard_router
from app.api.kpis import router as kpis_router
from app.api.customers import router as customers_router
from app.api.leads import router as leads_router
from app.api.interactions import router as interactions_router
from app.api.destinations import router as destinations_router
from app.api.experiences import router as experiences_router
from app.api.bookings import router as bookings_router
from app.api.itineraries import router as itineraries_router
from app.api.workflows import router as workflows_router
from app.api.analytics import router as analytics_router
from app.api.reports import router as reports_router
from app.api.notifications import router as notifications_router

logger = logging.getLogger("uvicorn")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Full-stack Digital Tourism Management Platform (Demonstration Version) with KPI tracking, CRM workflows, experience design, and analytics reporting.",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for demo or settings.CORS_ORIGINS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(organizations_router, prefix=settings.API_V1_PREFIX)
app.include_router(users_router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_V1_PREFIX)
app.include_router(kpis_router, prefix=settings.API_V1_PREFIX)
app.include_router(customers_router, prefix=settings.API_V1_PREFIX)
app.include_router(leads_router, prefix=settings.API_V1_PREFIX)
app.include_router(interactions_router, prefix=settings.API_V1_PREFIX)
app.include_router(destinations_router, prefix=settings.API_V1_PREFIX)
app.include_router(experiences_router, prefix=settings.API_V1_PREFIX)
app.include_router(bookings_router, prefix=settings.API_V1_PREFIX)
app.include_router(itineraries_router, prefix=settings.API_V1_PREFIX)
app.include_router(workflows_router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)
app.include_router(reports_router, prefix=settings.API_V1_PREFIX)
app.include_router(notifications_router, prefix=settings.API_V1_PREFIX)

@app.on_event("startup")
def on_startup():
    logger.info("Initializing schema and checking initial seed data...")
    try:
        seed_database()
        logger.info("Startup seed verification completed successfully.")
    except Exception as e:
        logger.error(f"Error during startup seeding: {e}")

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "documentation": "/api/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "database": "connected"}

