from fastapi import APIRouter, HTTPException, Response
from app.ml.pipeline import ml_service
import json

router = APIRouter(prefix="/model", tags=["Model Lab"])

@router.get("/metrics")
def get_model_metrics():
    if not ml_service.metrics:
        raise HTTPException(status_code=503, detail="Model metrics are currently unavailable.")
    return ml_service.metrics

@router.get("/feature-importance")
def get_feature_importance():
    if not ml_service.feature_importance:
        raise HTTPException(status_code=503, detail="Feature importance is not yet computed.")
    return {
        "model_name": ml_service.metrics.get("model_name", "Random Forest") if ml_service.metrics else "Random Forest",
        "feature_importances": ml_service.feature_importance,
        "calculation_method": "Gini Impurity Mean Decrease with Stratified K-Holdout"
    }

@router.post("/retrain")
def retrain_model():
    if ml_service.is_training:
        raise HTTPException(status_code=409, detail="A model retraining job is already actively running. Please wait.")
    try:
        updated_metrics = ml_service.train_models()
        return {
            "status": "success",
            "message": "ARMORSENSE models successfully retrained and validated.",
            "updated_at": updated_metrics.get("trained_at"),
            "metrics": updated_metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model retraining failed: {str(e)}")

@router.get("/report")
def download_model_report():
    if not ml_service.metrics:
        raise HTTPException(status_code=503, detail="Evaluation report not available.")
    
    report_dict = {
        "project": "ARMORSENSE - AI Predictive Maintenance",
        "generated_at": ml_service.metrics.get("trained_at"),
        "model_architecture": ml_service.metrics.get("model_name"),
        "version": ml_service.metrics.get("version"),
        "performance_metrics": {
            "accuracy": ml_service.metrics.get("accuracy"),
            "balanced_accuracy": ml_service.metrics.get("balanced_accuracy"),
            "precision": ml_service.metrics.get("precision"),
            "recall": ml_service.metrics.get("recall"),
            "f1_score": ml_service.metrics.get("f1_score"),
            "roc_auc": ml_service.metrics.get("roc_auc")
        },
        "confusion_matrix": ml_service.metrics.get("confusion_matrix"),
        "baseline_comparison": ml_service.metrics.get("baseline_metrics"),
        "multiclass_evaluation": ml_service.metrics.get("multiclass_metrics"),
        "global_feature_importances": ml_service.feature_importance,
        "disclaimer": "Metrics evaluated on a stratified 20% held-out test split of industrial machinery telemetry. Not military vehicle certified."
    }
    
    content = json.dumps(report_dict, indent=2)
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=armorsense_model_evaluation_report.json"}
    )
