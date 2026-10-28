from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON
from app.database import Base

class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    product_type = Column(String(10), nullable=False)
    air_temperature = Column(Float, nullable=False)
    process_temperature = Column(Float, nullable=False)
    rotational_speed = Column(Float, nullable=False)
    torque = Column(Float, nullable=False)
    tool_wear = Column(Float, nullable=False)
    
    # Model predictions
    failure_probability = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False)  # 0 to 100
    risk_category = Column(String(20), nullable=False)  # Low, Moderate, High, Critical
    predicted_failure_type = Column(String(50), nullable=True)
    confidence = Column(Float, nullable=True)
    
    # Detailed diagnosis
    warnings = Column(JSON, default=list)
    rule_alerts = Column(JSON, default=list)
    recommended_action = Column(Text, nullable=True)

class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    asset_id = Column(String(50), index=True, nullable=False)
    issue_observed = Column(Text, nullable=False)
    priority = Column(String(20), default="Medium")  # Low, Medium, High, Critical
    assigned_technician = Column(String(100), default="Unassigned")
    action_taken = Column(Text, nullable=True)
    status = Column(String(30), default="Pending")  # Pending, In Progress, Completed, Under Review
    source = Column(String(50), default="Diagnostic System")  # AI Prediction, Sensor Alert, Manual Inspection
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String(50), primary_key=True, index=True)
    value = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
