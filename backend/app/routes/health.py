from datetime import datetime
from fastapi import APIRouter
from app.config import settings
from app.ml.pipeline import ml_service
from app.services.dataset_service import dataset_service

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health():
    dataset_summary = dataset_service.get_summary()
    has_dataset = dataset_summary.get("total_records", 0) > 0
    has_model = ml_service.binary_pipeline is not None
    
    return {
        "status": "online" if has_dataset and has_model else "degraded",
        "system_name": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "tagline": settings.TAGLINE,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "dataset_status": {
            "loaded": has_dataset,
            "filename": settings.DATASET_FILENAME,
            "total_records": dataset_summary.get("total_records", 0),
            "integrity": "verified" if has_dataset else "missing"
        },
        "model_status": {
            "loaded": has_model,
            "model_name": ml_service.metrics.get("model_name", "Unknown") if ml_service.metrics else "Not loaded",
            "last_trained_at": ml_service.metrics.get("trained_at") if ml_service.metrics else None,
            "test_roc_auc": ml_service.metrics.get("roc_auc") if ml_service.metrics else None
        },
        "hardware_integration": {
            "mode": "Simulated Sensor Telemetry",
            "scanner_connected": False,
            "hardware_note": "Physical OBD-II / vehicle telemetry hardware not connected; simulation engine active."
        }
    }
