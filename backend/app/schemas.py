from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, ConfigDict

class SensorInput(BaseModel):
    product_type: Literal["L", "M", "H"] = Field(..., description="Variant type: L (Low), M (Medium), H (High)")
    air_temperature: float = Field(..., description="Air temperature in Kelvin (e.g. 295.0 to 308.0)")
    process_temperature: float = Field(..., description="Process temperature in Kelvin (e.g. 305.0 to 318.0)")
    rotational_speed: float = Field(..., description="Rotational speed in RPM (e.g. 1000 to 2800)")
    torque: float = Field(..., description="Torque in Nm (e.g. 10.0 to 80.0)")
    tool_wear: float = Field(..., description="Tool wear in minutes (e.g. 0 to 250)")

    @field_validator("air_temperature")
    @classmethod
    def validate_air_temp(cls, v):
        if v < 200.0 or v > 400.0:
            raise ValueError(f"Air temperature {v} K is outside plausible physical range (200-400 K)")
        return v

    @field_validator("process_temperature")
    @classmethod
    def validate_proc_temp(cls, v):
        if v < 200.0 or v > 400.0:
            raise ValueError(f"Process temperature {v} K is outside plausible physical range (200-400 K)")
        return v

    @field_validator("rotational_speed")
    @classmethod
    def validate_speed(cls, v):
        if v < 100.0 or v > 5000.0:
            raise ValueError(f"Rotational speed {v} rpm is outside operating limits (100-5000 rpm)")
        return v

    @field_validator("torque")
    @classmethod
    def validate_torque(cls, v):
        if v < 0.0 or v > 200.0:
            raise ValueError(f"Torque {v} Nm is outside operating limits (0-200 Nm)")
        return v

    @field_validator("tool_wear")
    @classmethod
    def validate_wear(cls, v):
        if v < 0.0 or v > 500.0:
            raise ValueError(f"Tool wear {v} min is outside plausible bounds (0-500 min)")
        return v

class FeatureContribution(BaseModel):
    feature: str
    value: float
    importance_weight: float
    status: Literal["normal", "warning", "critical"]
    note: str

class RuleAlert(BaseModel):
    rule_name: str
    severity: Literal["Info", "Warning", "Critical"]
    trigger_condition: str
    explanation: str

class PredictionResponse(BaseModel):
    failure_probability: float = Field(..., description="Raw model probability (0.0 to 1.0)")
    calibrated_risk_score: float = Field(..., description="Risk score scaled 0 to 100")
    risk_category: Literal["Low", "Moderate", "High", "Critical"]
    predicted_failure_type: Optional[str] = Field(None, description="Category if failure risk is notable")
    type_confidence: Optional[float] = Field(None, description="Confidence of the multiclass failure-type model")
    uncertainty_warning: Optional[str] = None
    warnings: List[str] = []
    rule_alerts: List[RuleAlert] = []
    feature_contributions: List[FeatureContribution] = []
    recommended_action: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class PredictionHistoryResponse(BaseModel):
    id: int
    timestamp: datetime
    product_type: str
    air_temperature: float
    process_temperature: float
    rotational_speed: float
    torque: float
    tool_wear: float
    failure_probability: float
    risk_score: float
    risk_category: str
    predicted_failure_type: Optional[str]
    confidence: Optional[float]
    warnings: List[str]
    rule_alerts: List[Dict[str, Any]]
    recommended_action: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class MaintenanceCreate(BaseModel):
    asset_id: str
    issue_observed: str
    priority: Literal["Low", "Medium", "High", "Critical"] = "Medium"
    assigned_technician: str = "Unassigned"
    action_taken: Optional[str] = None
    status: Literal["Pending", "In Progress", "Completed", "Under Review"] = "Pending"
    source: str = "Diagnostic System"

class MaintenanceUpdate(BaseModel):
    issue_observed: Optional[str] = None
    priority: Optional[Literal["Low", "Medium", "High", "Critical"]] = None
    assigned_technician: Optional[str] = None
    action_taken: Optional[str] = None
    status: Optional[Literal["Pending", "In Progress", "Completed", "Under Review"]] = None

class MaintenanceResponse(BaseModel):
    id: int
    asset_id: str
    issue_observed: str
    priority: str
    assigned_technician: str
    action_taken: Optional[str]
    status: str
    source: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DatasetRecord(BaseModel):
    udi: int
    product_id: str
    type: str
    air_temperature: float
    process_temperature: float
    rotational_speed: float
    torque: float
    tool_wear: float
    target: int
    failure_type: str

class DatasetSummary(BaseModel):
    total_records: int
    normal_records: int
    failure_records: int
    failure_rate_percentage: float
    product_type_distribution: Dict[str, int]
    failure_type_distribution: Dict[str, int]
    missing_values_count: int
    numerical_summary: Dict[str, Dict[str, float]]

class ModelMetrics(BaseModel):
    model_name: str
    version: str
    trained_at: str
    train_size: int
    test_size: int
    failure_cases_train: int
    failure_cases_test: int
    accuracy: float
    balanced_accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    confusion_matrix: List[List[int]]
    baseline_metrics: Dict[str, Any]
    multiclass_metrics: Optional[Dict[str, Any]] = None
    feature_names: List[str]
    class_weights_used: str

class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float
    description: str

class FeatureImportanceResponse(BaseModel):
    model_name: str
    feature_importances: List[FeatureImportanceItem]
    calculation_method: str

class SystemThresholdsUpdate(BaseModel):
    threshold_low: float = Field(..., ge=0.0, le=1.0)
    threshold_moderate: float = Field(..., ge=0.0, le=1.0)
    threshold_high: float = Field(..., ge=0.0, le=1.0)
    threshold_critical: float = Field(..., ge=0.0, le=1.0)
