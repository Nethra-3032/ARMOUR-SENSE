import os
import json
import math
import logging
import threading
from datetime import datetime
from typing import Dict, Any, Tuple, Optional, List
from pathlib import Path

import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.dummy import DummyClassifier
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix, classification_report
)

from app.config import settings

logger = logging.getLogger(__name__)

FEATURE_NUMERIC_RAW = [
    "Air temperature [K]",
    "Process temperature [K]",
    "Rotational speed [rpm]",
    "Torque [Nm]",
    "Tool wear [min]"
]
FEATURE_CATEGORICAL = ["Type"]

def feature_engineering(df: pd.DataFrame) -> pd.DataFrame:
    """Computes derived physics-based features."""
    df_feat = df.copy()
    
    # 1. Temperature difference (Heat Dissipation Gradient)
    df_feat["Temp_Diff"] = df_feat["Process temperature [K]"] - df_feat["Air temperature [K]"]
    
    # 2. Rotational Power in Watts: Power = Torque * (rpm * 2 * pi / 60)
    df_feat["Power_Watts"] = df_feat["Torque [Nm]"] * (df_feat["Rotational speed [rpm]"] * 2.0 * math.pi / 60.0)
    
    # 3. Tool Overstrain Index: Torque * Tool Wear
    df_feat["Strain_Index"] = df_feat["Torque [Nm]"] * df_feat["Tool wear [min]"]
    
    return df_feat

class MLService:
    def __init__(self):
        self._lock = threading.Lock()
        self.is_training: bool = False
        
        self.binary_pipeline: Optional[Pipeline] = None
        self.multiclass_pipeline: Optional[Pipeline] = None
        self.metrics: Optional[Dict[str, Any]] = None
        self.feature_importance: Optional[List[Dict[str, Any]]] = None
        
        self.load_model()

    def get_dataset_path(self) -> Path:
        if settings.DATASET_PATH.exists():
            return settings.DATASET_PATH
        if settings.FALLBACK_DATASET_PATH.exists():
            return settings.FALLBACK_DATASET_PATH
        raise FileNotFoundError(f"Dataset not found at {settings.DATASET_PATH} or {settings.FALLBACK_DATASET_PATH}")

    def load_dataset(self) -> pd.DataFrame:
        path = self.get_dataset_path()
        df = pd.read_excel(path)
        # Validate columns
        required_cols = [
            "UDI", "Product ID", "Type", "Air temperature [K]",
            "Process temperature [K]", "Rotational speed [rpm]",
            "Torque [Nm]", "Tool wear [min]", "Target", "Failure Type"
        ]
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            raise ValueError(f"Dataset is missing required columns: {missing}")
        return df

    def train_models(self) -> Dict[str, Any]:
        with self._lock:
            self.is_training = True
            try:
                logger.info("Starting ARMORSENSE model training pipeline...")
                df = self.load_dataset()
                
                # Feature engineering
                df_engineered = feature_engineering(df)
                
                numeric_cols = FEATURE_NUMERIC_RAW + ["Temp_Diff", "Power_Watts", "Strain_Index"]
                categorical_cols = FEATURE_CATEGORICAL
                feature_names_in = categorical_cols + numeric_cols
                
                X = df_engineered[feature_names_in]
                y_binary = df_engineered["Target"].values
                
                # Stratified split: 80% train, 20% test
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y_binary, test_size=0.20, random_state=42, stratify=y_binary
                )
                
                preprocessor = ColumnTransformer(
                    transformers=[
                        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_cols),
                        ("num", StandardScaler(), numeric_cols)
                    ]
                )
                
                # Binary Failure Risk Classifier
                rf_binary = RandomForestClassifier(
                    n_estimators=150,
                    max_depth=12,
                    min_samples_split=4,
                    min_samples_leaf=2,
                    class_weight="balanced",
                    random_state=42,
                    n_jobs=-1
                )
                
                binary_pipeline = Pipeline([
                    ("preprocessor", preprocessor),
                    ("classifier", rf_binary)
                ])
                
                binary_pipeline.fit(X_train, y_train)
                
                # Test evaluations
                y_pred = binary_pipeline.predict(X_test)
                y_prob = binary_pipeline.predict_proba(X_test)[:, 1]
                
                acc = float(accuracy_score(y_test, y_pred))
                bal_acc = float(balanced_accuracy_score(y_test, y_pred))
                prec = float(precision_score(y_test, y_pred, zero_division=0))
                rec = float(recall_score(y_test, y_pred, zero_division=0))
                f1 = float(f1_score(y_test, y_pred, zero_division=0))
                auc = float(roc_auc_score(y_test, y_prob))
                cm = confusion_matrix(y_test, y_pred).tolist()
                
                # Baseline comparison: Logistic Regression (balanced) & Dummy
                logreg_pipeline = Pipeline([
                    ("preprocessor", preprocessor),
                    ("classifier", LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42))
                ])
                logreg_pipeline.fit(X_train, y_train)
                log_pred = logreg_pipeline.predict(X_test)
                log_prob = logreg_pipeline.predict_proba(X_test)[:, 1]
                
                dummy = DummyClassifier(strategy="prior")
                dummy.fit(X_train, y_train)
                dummy_pred = dummy.predict(X_test)
                
                baseline_metrics = {
                    "logistic_regression": {
                        "accuracy": round(float(accuracy_score(y_test, log_pred)), 4),
                        "precision": round(float(precision_score(y_test, log_pred, zero_division=0)), 4),
                        "recall": round(float(recall_score(y_test, log_pred, zero_division=0)), 4),
                        "f1_score": round(float(f1_score(y_test, log_pred, zero_division=0)), 4),
                        "roc_auc": round(float(roc_auc_score(y_test, log_prob)), 4)
                    },
                    "dummy_prior": {
                        "accuracy": round(float(accuracy_score(y_test, dummy_pred)), 4),
                        "precision": round(float(precision_score(y_test, dummy_pred, zero_division=0)), 4),
                        "recall": round(float(recall_score(y_test, dummy_pred, zero_division=0)), 4),
                        "f1_score": round(float(f1_score(y_test, dummy_pred, zero_division=0)), 4)
                    }
                }
                
                # Multiclass Failure Type Classifier
                # Trained strictly on failure cases (Target == 1)
                failure_mask_train = df.iloc[X_train.index]["Target"] == 1
                failure_mask_test = df.iloc[X_test.index]["Target"] == 1
                
                X_train_fail = X_train[failure_mask_train]
                y_train_fail = df.iloc[X_train.index][failure_mask_train]["Failure Type"].values
                
                X_test_fail = X_test[failure_mask_test]
                y_test_fail = df.iloc[X_test.index][failure_mask_test]["Failure Type"].values
                
                rf_multiclass = RandomForestClassifier(
                    n_estimators=100,
                    max_depth=8,
                    class_weight="balanced",
                    random_state=42,
                    n_jobs=-1
                )
                
                multi_preprocessor = ColumnTransformer(
                    transformers=[
                        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_cols),
                        ("num", StandardScaler(), numeric_cols)
                    ]
                )
                
                multiclass_pipeline = Pipeline([
                    ("preprocessor", multi_preprocessor),
                    ("classifier", rf_multiclass)
                ])
                
                multiclass_pipeline.fit(X_train_fail, y_train_fail)
                multi_pred = multiclass_pipeline.predict(X_test_fail)
                multi_acc = float(accuracy_score(y_test_fail, multi_pred))
                
                multiclass_metrics = {
                    "failure_subset_test_size": len(y_test_fail),
                    "test_accuracy": round(multi_acc, 4),
                    "classes": list(rf_multiclass.classes_),
                    "test_classification_report": classification_report(y_test_fail, multi_pred, output_dict=True, zero_division=0)
                }
                
                # Extract Global Feature Importances
                onehot_cats = list(binary_pipeline.named_steps["preprocessor"].named_transformers_["cat"].get_feature_names_out(categorical_cols))
                all_transformed_features = onehot_cats + numeric_cols
                importances = binary_pipeline.named_steps["classifier"].feature_importances_
                
                importance_items = []
                for feat, imp in zip(all_transformed_features, importances):
                    desc = "Operational telemetry signal"
                    if "Temp_Diff" in feat:
                        desc = "Heat Dissipation Delta (Process - Air Temp)"
                    elif "Power_Watts" in feat:
                        desc = "Mechanical Power Output (Torque x Speed)"
                    elif "Strain_Index" in feat:
                        desc = "Overstrain Factor (Torque x Tool Wear)"
                    elif "Torque" in feat:
                        desc = "Spindle Torque (Resistance / Load)"
                    elif "Rotational speed" in feat:
                        desc = "Drive Spindle Angular Velocity"
                    elif "Tool wear" in feat:
                        desc = "Tool Usage Wear Duration"
                    elif "Type" in feat:
                        desc = "Product Variant Category (L/M/H)"
                        
                    importance_items.append({
                        "feature": feat,
                        "importance": round(float(imp), 4),
                        "description": desc
                    })
                
                importance_items.sort(key=lambda x: x["importance"], reverse=True)
                
                metrics_data = {
                    "model_name": "RandomForestClassifier (Ensemble Balanced)",
                    "version": "1.0.0",
                    "trained_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
                    "train_size": len(X_train),
                    "test_size": len(X_test),
                    "failure_cases_train": int(sum(y_train)),
                    "failure_cases_test": int(sum(y_test)),
                    "accuracy": round(acc, 4),
                    "balanced_accuracy": round(bal_acc, 4),
                    "precision": round(prec, 4),
                    "recall": round(rec, 4),
                    "f1_score": round(f1, 4),
                    "roc_auc": round(auc, 4),
                    "confusion_matrix": cm,
                    "baseline_metrics": baseline_metrics,
                    "multiclass_metrics": multiclass_metrics,
                    "feature_names": all_transformed_features,
                    "class_weights_used": "balanced"
                }
                
                # Persist to disk
                settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
                joblib.dump({
                    "binary_pipeline": binary_pipeline,
                    "multiclass_pipeline": multiclass_pipeline,
                    "feature_names": all_transformed_features,
                    "importance_items": importance_items
                }, settings.MODEL_PATH)
                
                with open(settings.METRICS_PATH, "w") as f:
                    json.dump(metrics_data, f, indent=2)
                    
                self.binary_pipeline = binary_pipeline
                self.multiclass_pipeline = multiclass_pipeline
                self.metrics = metrics_data
                self.feature_importance = importance_items
                
                logger.info(f"Model trained successfully. Test F1: {f1:.4f}, ROC-AUC: {auc:.4f}")
                return metrics_data
            finally:
                self.is_training = False

    def load_model(self):
        try:
            if settings.MODEL_PATH.exists() and settings.METRICS_PATH.exists():
                bundle = joblib.load(settings.MODEL_PATH)
                self.binary_pipeline = bundle["binary_pipeline"]
                self.multiclass_pipeline = bundle.get("multiclass_pipeline")
                self.feature_importance = bundle.get("importance_items", [])
                
                with open(settings.METRICS_PATH, "r") as f:
                    self.metrics = json.load(f)
                logger.info("Existing ARMORSENSE models loaded successfully.")
            else:
                logger.info("No saved model found. Training fresh model...")
                self.train_models()
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            try:
                self.train_models()
            except Exception as train_err:
                logger.error(f"Failed to train fallback model: {train_err}")

    def predict(
        self,
        product_type: str,
        air_temp: float,
        process_temp: float,
        speed: float,
        torque: float,
        tool_wear: float
    ) -> Dict[str, Any]:
        if not self.binary_pipeline:
            raise RuntimeError("ML Model is not loaded or initialized.")
            
        raw_df = pd.DataFrame([{
            "Type": product_type,
            "Air temperature [K]": air_temp,
            "Process temperature [K]": process_temp,
            "Rotational speed [rpm]": speed,
            "Torque [Nm]": torque,
            "Tool wear [min]": tool_wear
        }])
        
        # Apply feature engineering
        engineered_df = feature_engineering(raw_df)
        
        # Binary prediction
        y_prob = float(self.binary_pipeline.predict_proba(engineered_df)[0, 1])
        calibrated_score = round(y_prob * 100.0, 1)
        
        # Categorize risk based on configurable operational thresholds:
        # Critical: >= High threshold (or Critical threshold)
        if y_prob >= settings.THRESHOLD_CRITICAL:
            risk_category = "Critical"
        elif y_prob >= settings.THRESHOLD_HIGH:
            risk_category = "Critical"
        elif y_prob >= settings.THRESHOLD_MODERATE:
            risk_category = "High"
        elif y_prob >= settings.THRESHOLD_LOW:
            risk_category = "Moderate"
        else:
            risk_category = "Low"
            
        # Multiclass prediction (only if failure risk is notable)
        predicted_type = None
        type_conf = None
        uncertainty = None
        
        if y_prob >= 0.25 and self.multiclass_pipeline:
            probs = self.multiclass_pipeline.predict_proba(engineered_df)[0]
            classes = self.multiclass_pipeline.classes_
            max_idx = int(np.argmax(probs))
            type_conf = float(probs[max_idx])
            
            if type_conf > 0.40:
                predicted_type = str(classes[max_idx])
            else:
                predicted_type = "Uncertain Failure Mode"
                uncertainty = "Low subtype classification certainty across failure modes."
        else:
            predicted_type = "No Failure Expected"
            type_conf = round(1.0 - y_prob, 2)
            
        # Feature contributions
        contributions = []
        if self.feature_importance:
            top_feats = self.feature_importance[:5]
            for item in top_feats:
                feat_name = item["feature"]
                val = 0.0
                status = "normal"
                note = "Within normal operating envelope"
                
                if "Temp_Diff" in feat_name:
                    val = round(process_temp - air_temp, 2)
                    if val > 12.0 or val < 8.0:
                        status = "warning"
                        note = "Abnormal thermal dissipation"
                elif "Power_Watts" in feat_name:
                    val = round(torque * (speed * 2.0 * math.pi / 60.0), 1)
                    if val > 9000.0:
                        status = "critical"
                        note = "Spindle power spike overload"
                elif "Strain_Index" in feat_name:
                    val = round(torque * tool_wear, 1)
                    if val > 11000.0:
                        status = "critical"
                        note = "Extreme combined mechanical strain"
                elif "Tool wear" in feat_name:
                    val = tool_wear
                    if tool_wear >= 200.0:
                        status = "critical"
                        note = "Near tool breakage threshold"
                    elif tool_wear >= 160.0:
                        status = "warning"
                        note = "Elevated tool wear"
                elif "Torque" in feat_name:
                    val = torque
                    if torque > 65.0:
                        status = "warning"
                        note = "High torque load"
                elif "Rotational speed" in feat_name:
                    val = speed
                    if speed < 1100 or speed > 2200:
                        status = "warning"
                        note = "Non-optimal operating speed"
                        
                contributions.append({
                    "feature": feat_name,
                    "value": val,
                    "importance_weight": item["importance"],
                    "status": status,
                    "note": note
                })
                
        return {
            "failure_probability": round(y_prob, 4),
            "calibrated_risk_score": calibrated_score,
            "risk_category": risk_category,
            "predicted_failure_type": predicted_type,
            "type_confidence": round(type_conf, 4) if type_conf else None,
            "uncertainty_warning": uncertainty,
            "feature_contributions": contributions
        }

ml_service = MLService()
