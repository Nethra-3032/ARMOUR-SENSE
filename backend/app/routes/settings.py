from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import SystemSetting
from app.schemas import SystemThresholdsUpdate

router = APIRouter(prefix="/settings", tags=["System Settings"])

@router.get("")
def get_system_settings(db: Session = Depends(get_db)):
    # Check DB overrides or fall back to default settings
    t_low = db.query(SystemSetting).filter(SystemSetting.key == "THRESHOLD_LOW").first()
    t_mod = db.query(SystemSetting).filter(SystemSetting.key == "THRESHOLD_MODERATE").first()
    t_high = db.query(SystemSetting).filter(SystemSetting.key == "THRESHOLD_HIGH").first()
    t_crit = db.query(SystemSetting).filter(SystemSetting.key == "THRESHOLD_CRITICAL").first()
    
    return {
        "system_name": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "tagline": settings.TAGLINE,
        "operating_modes": [
            {
                "id": "demonstration",
                "name": "Dataset Demonstration Mode",
                "active": True,
                "description": "Full access to 10,000 real dataset records, statistical analytics, and historical evaluations."
            },
            {
                "id": "simulated",
                "name": "Simulated Sensor Telemetry Mode",
                "active": True,
                "description": "Synthetic real-time telemetry stream bounded by real equipment distribution for dynamic live testing."
            },
            {
                "id": "hardware",
                "name": "Connected Hardware Mode",
                "active": False,
                "description": "Requires physical OBD-II / CAN-Bus adapter connected to a vehicle testbed. Status: Disconnected."
            }
        ],
        "active_mode": "Simulated Sensor Mode",
        "hardware_connected": False,
        "hardware_warning": "No physical sensor integration configured. Simulated data generated strictly within dataset boundaries.",
        "thresholds": {
            "low": float(t_low.value) if t_low else settings.THRESHOLD_LOW,
            "moderate": float(t_mod.value) if t_mod else settings.THRESHOLD_MODERATE,
            "high": float(t_high.value) if t_high else settings.THRESHOLD_HIGH,
            "critical": float(t_crit.value) if t_crit else settings.THRESHOLD_CRITICAL
        },
        "threshold_note": "These thresholds are prototype decision-support parameters for college project demonstration and do NOT represent certified industrial safety standards."
    }

@router.post("/thresholds")
def update_thresholds(
    thresholds: SystemThresholdsUpdate,
    db: Session = Depends(get_db)
):
    if not (thresholds.threshold_low < thresholds.threshold_moderate < thresholds.threshold_high < thresholds.threshold_critical):
        raise HTTPException(status_code=400, detail="Thresholds must satisfy: Low < Moderate < High < Critical")

    def upsert(key: str, val: float, desc: str):
        item = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if not item:
            item = SystemSetting(key=key, value=str(val), description=desc, updated_at=datetime.utcnow())
            db.add(item)
        else:
            item.value = str(val)
            item.updated_at = datetime.utcnow()

    upsert("THRESHOLD_LOW", thresholds.threshold_low, "Low Risk cutoff")
    upsert("THRESHOLD_MODERATE", thresholds.threshold_moderate, "Moderate Risk cutoff")
    upsert("THRESHOLD_HIGH", thresholds.threshold_high, "High Risk cutoff")
    upsert("THRESHOLD_CRITICAL", thresholds.threshold_critical, "Critical Risk cutoff")

    # Update in-memory settings
    settings.THRESHOLD_LOW = thresholds.threshold_low
    settings.THRESHOLD_MODERATE = thresholds.threshold_moderate
    settings.THRESHOLD_HIGH = thresholds.threshold_high
    settings.THRESHOLD_CRITICAL = thresholds.threshold_critical

    db.commit()
    return {
        "status": "success",
        "message": "Operational risk thresholds updated successfully.",
        "updated_thresholds": {
            "low": thresholds.threshold_low,
            "moderate": thresholds.threshold_moderate,
            "high": thresholds.threshold_high,
            "critical": thresholds.threshold_critical
        }
    }
