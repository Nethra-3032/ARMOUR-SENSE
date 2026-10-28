import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import MaintenanceRecord, PredictionHistory
from app.routes import health, dataset, predict, model, maintenance, settings as settings_route

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("armorsense")

def seed_initial_maintenance(db):
    """Seeds realistic initial maintenance work orders if database is empty."""
    count = db.query(MaintenanceRecord).count()
    if count == 0:
        logger.info("Seeding initial maintenance audit records...")
        sample_records = [
            MaintenanceRecord(
                asset_id="M10018",
                issue_observed="Severe tool wear (>220 min) and high thermal gradient detected during high-torque milling cycle.",
                priority="Critical",
                assigned_technician="Tech. Rajesh Sharma",
                action_taken="Scheduled tool insert replacement and inspected coolant delivery nozzles.",
                status="In Progress",
                source="AI Prediction Model",
                created_at=datetime.utcnow()
            ),
            MaintenanceRecord(
                asset_id="L10002",
                issue_observed="Rotational speed fluctuation and spindle vibration warning logged during load transition.",
                priority="Medium",
                assigned_technician="Tech. Anita Patel",
                action_taken="Inspected drive belt tension and encoder cabling. Re-calibrated transducer.",
                status="Completed",
                source="Sensor Anomaly Rule",
                created_at=datetime.utcnow()
            ),
            MaintenanceRecord(
                asset_id="H10014",
                issue_observed="Process temperature elevated to 312.7 K with 12.2 K delta against ambient air.",
                priority="High",
                assigned_technician="Tech. David Miller",
                action_taken="Cooling radiator flush performed; thermal paste inspected.",
                status="Under Review",
                source="Rule-Based Alert",
                created_at=datetime.utcnow()
            ),
            MaintenanceRecord(
                asset_id="M10004",
                issue_observed="High torque spike (41.0 Nm) combined with rotational speed drops under heavy workpiece cut.",
                priority="Low",
                assigned_technician="Tech. Priya Menon",
                action_taken="Standard lubrication applied to linear guideways.",
                status="Pending",
                source="Operator Log",
                created_at=datetime.utcnow()
            )
        ]
        db.add_all(sample_records)
        db.commit()

# Ensure tables exist immediately upon import
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing ARMORSENSE Backend...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_maintenance(db)
    finally:
        db.close()
    logger.info("Database initialized successfully.")
    yield
    logger.info("Shutting down ARMORSENSE Backend...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="ARMORSENSE - AI Predictive Maintenance Command Center for Equipment Health & Reliability.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for seamless local dev preview
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes under /api
app.include_router(health.router, prefix="/api")
app.include_router(dataset.router, prefix="/api")
app.include_router(predict.router, prefix="/api")
app.include_router(model.router, prefix="/api")
app.include_router(maintenance.router, prefix="/api")
app.include_router(settings_route.router, prefix="/api")

@app.get("/")
def root():
    return {
        "system": "ARMORSENSE - Industrial AI Predictive Maintenance Command Center",
        "tagline": settings.TAGLINE,
        "docs_url": "/docs",
        "api_health": "/api/health"
    }
