from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import PredictionHistory
from app.schemas import SensorInput, PredictionResponse, PredictionHistoryResponse
from app.ml.pipeline import ml_service
from app.services.rules_engine import evaluate_mechanical_rules

router = APIRouter(tags=["Prediction"])

@router.post("/predict", response_model=PredictionResponse)
def predict_equipment_health(
    telemetry: SensorInput,
    db: Session = Depends(get_db)
):
    try:
        # Run ML model inference
        ml_result = ml_service.predict(
            product_type=telemetry.product_type,
            air_temp=telemetry.air_temperature,
            process_temp=telemetry.process_temperature,
            speed=telemetry.rotational_speed,
            torque=telemetry.torque,
            tool_wear=telemetry.tool_wear
        )
        
        # Evaluate physical & mechanical engineering rules
        rule_alerts, out_of_dist_warnings, recommended_action = evaluate_mechanical_rules(
            product_type=telemetry.product_type,
            air_temp=telemetry.air_temperature,
            process_temp=telemetry.process_temperature,
            speed=telemetry.rotational_speed,
            torque=telemetry.torque,
            tool_wear=telemetry.tool_wear,
            model_prob=ml_result["failure_probability"]
        )
        
        # Combine ML warnings with out-of-distribution warnings
        combined_warnings = list(out_of_dist_warnings)
        if ml_result.get("uncertainty_warning"):
            combined_warnings.append(ml_result["uncertainty_warning"])
            
        # Store in SQLite prediction history
        history_entry = PredictionHistory(
            timestamp=datetime.utcnow(),
            product_type=telemetry.product_type,
            air_temperature=telemetry.air_temperature,
            process_temperature=telemetry.process_temperature,
            rotational_speed=telemetry.rotational_speed,
            torque=telemetry.torque,
            tool_wear=telemetry.tool_wear,
            failure_probability=ml_result["failure_probability"],
            risk_score=ml_result["calibrated_risk_score"],
            risk_category=ml_result["risk_category"],
            predicted_failure_type=ml_result["predicted_failure_type"],
            confidence=ml_result["type_confidence"],
            warnings=combined_warnings,
            rule_alerts=rule_alerts,
            recommended_action=recommended_action
        )
        db.add(history_entry)
        db.commit()
        db.refresh(history_entry)
        
        return PredictionResponse(
            failure_probability=ml_result["failure_probability"],
            calibrated_risk_score=ml_result["calibrated_risk_score"],
            risk_category=ml_result["risk_category"],
            predicted_failure_type=ml_result["predicted_failure_type"],
            type_confidence=ml_result["type_confidence"],
            uncertainty_warning=ml_result["uncertainty_warning"],
            warnings=combined_warnings,
            rule_alerts=rule_alerts,
            feature_contributions=ml_result["feature_contributions"],
            recommended_action=recommended_action,
            timestamp=history_entry.timestamp
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Prediction evaluation failed: {str(e)}")

@router.get("/predictions/history", response_model=List[PredictionHistoryResponse])
def get_prediction_history(
    limit: int = Query(25, ge=1, le=200, description="Max history records to return"),
    risk_category: Optional[str] = Query(None, description="Filter by risk level"),
    db: Session = Depends(get_db)
):
    query = db.query(PredictionHistory)
    if risk_category and risk_category != "ALL":
        query = query.filter(PredictionHistory.risk_category == risk_category)
    records = query.order_by(desc(PredictionHistory.timestamp)).limit(limit).all()
    return records

@router.delete("/predictions/history")
def clear_prediction_history(db: Session = Depends(get_db)):
    deleted_count = db.query(PredictionHistory).delete()
    db.commit()
    return {"message": "Prediction history cleared successfully", "deleted_count": deleted_count}
