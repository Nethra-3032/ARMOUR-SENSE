import math
import logging
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from app.config import settings

logger = logging.getLogger(__name__)

class DatasetService:
    def __init__(self):
        self._df: Optional[pd.DataFrame] = None
        self._summary: Optional[Dict[str, Any]] = None
        self.load_data()

    def get_dataset_path(self):
        if settings.DATASET_PATH.exists():
            return settings.DATASET_PATH
        if settings.FALLBACK_DATASET_PATH.exists():
            return settings.FALLBACK_DATASET_PATH
        raise FileNotFoundError(f"Dataset not found at {settings.DATASET_PATH}")

    def load_data(self):
        try:
            path = self.get_dataset_path()
            logger.info(f"Loading Excel dataset from {path}")
            df = pd.read_excel(path)
            
            # Add derived physics columns for analytics
            df["Temp_Diff"] = df["Process temperature [K]"] - df["Air temperature [K]"]
            df["Power_Watts"] = df["Torque [Nm]"] * (df["Rotational speed [rpm]"] * 2.0 * math.pi / 60.0)
            df["Strain_Index"] = df["Torque [Nm]"] * df["Tool wear [min]"]
            
            self._df = df
            self._compute_summary()
            logger.info(f"Loaded {len(df)} records from dataset successfully.")
        except Exception as e:
            logger.error(f"Failed to load dataset: {e}")
            self._df = None

    def _compute_summary(self):
        if self._df is None:
            return
            
        df = self._df
        total = int(len(df))
        target_counts = df["Target"].value_counts().to_dict()
        normal = int(target_counts.get(0, 0))
        failures = int(target_counts.get(1, 0))
        failure_rate = round((failures / total) * 100.0, 2) if total > 0 else 0.0
        
        type_counts = {str(k): int(v) for k, v in df["Type"].value_counts().to_dict().items()}
        failure_type_counts = {str(k): int(v) for k, v in df["Failure Type"].value_counts().to_dict().items()}
        
        num_cols = [
            "Air temperature [K]", "Process temperature [K]",
            "Rotational speed [rpm]", "Torque [Nm]", "Tool wear [min]", "Temp_Diff", "Power_Watts"
        ]
        num_summary = {}
        for col in num_cols:
            if col in df.columns:
                num_summary[col] = {
                    "min": round(float(df[col].min()), 2),
                    "max": round(float(df[col].max()), 2),
                    "mean": round(float(df[col].mean()), 2),
                    "std": round(float(df[col].std()), 2)
                }
                
        self._summary = {
            "total_records": total,
            "normal_records": normal,
            "failure_records": failures,
            "failure_rate_percentage": failure_rate,
            "product_type_distribution": type_counts,
            "failure_type_distribution": failure_type_counts,
            "missing_values_count": int(df.isnull().sum().sum()),
            "numerical_summary": num_summary
        }

    def get_summary(self) -> Dict[str, Any]:
        if not self._summary:
            self.load_data()
        return self._summary or {}

    def get_records(
        self,
        page: int = 1,
        page_size: int = 25,
        search: Optional[str] = None,
        product_type: Optional[str] = None,
        failure_type: Optional[str] = None,
        target: Optional[int] = None,
        min_speed: Optional[float] = None,
        max_speed: Optional[float] = None,
        min_torque: Optional[float] = None,
        max_torque: Optional[float] = None,
        sort_by: str = "UDI",
        sort_order: str = "asc"
    ) -> Dict[str, Any]:
        if self._df is None:
            self.load_data()
        if self._df is None:
            return {"records": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}

        filtered = self._df
        
        if search:
            s = search.strip().upper()
            filtered = filtered[
                filtered["Product ID"].str.upper().str.contains(s) | 
                filtered["UDI"].astype(str).str.contains(s)
            ]
            
        if product_type and product_type != "ALL":
            filtered = filtered[filtered["Type"] == product_type.upper()]
            
        if failure_type and failure_type != "ALL":
            filtered = filtered[filtered["Failure Type"] == failure_type]
            
        if target is not None:
            filtered = filtered[filtered["Target"] == target]
            
        if min_speed is not None:
            filtered = filtered[filtered["Rotational speed [rpm]"] >= min_speed]
        if max_speed is not None:
            filtered = filtered[filtered["Rotational speed [rpm]"] <= max_speed]
            
        if min_torque is not None:
            filtered = filtered[filtered["Torque [Nm]"] >= min_torque]
        if max_torque is not None:
            filtered = filtered[filtered["Torque [Nm]"] <= max_torque]

        # Sorting
        col_map = {
            "udi": "UDI",
            "product_id": "Product ID",
            "air_temperature": "Air temperature [K]",
            "process_temperature": "Process temperature [K]",
            "rotational_speed": "Rotational speed [rpm]",
            "torque": "Torque [Nm]",
            "tool_wear": "Tool wear [min]",
            "target": "Target"
        }
        actual_col = col_map.get(sort_by.lower(), "UDI")
        if actual_col in filtered.columns:
            ascending = (sort_order.lower() == "asc")
            filtered = filtered.sort_values(by=actual_col, ascending=ascending)

        total_count = len(filtered)
        total_pages = max(1, math.ceil(total_count / page_size))
        page = max(1, min(page, total_pages))
        
        start = (page - 1) * page_size
        end = start + page_size
        slice_df = filtered.iloc[start:end]
        
        records = []
        for _, row in slice_df.iterrows():
            records.append({
                "udi": int(row["UDI"]),
                "product_id": str(row["Product ID"]),
                "type": str(row["Type"]),
                "air_temperature": round(float(row["Air temperature [K]"]), 2),
                "process_temperature": round(float(row["Process temperature [K]"]), 2),
                "rotational_speed": round(float(row["Rotational speed [rpm]"]), 1),
                "torque": round(float(row["Torque [Nm]"]), 2),
                "tool_wear": round(float(row["Tool wear [min]"]), 1),
                "target": int(row["Target"]),
                "failure_type": str(row["Failure Type"]),
                "temp_diff": round(float(row.get("Temp_Diff", 0.0)), 2),
                "power_watts": round(float(row.get("Power_Watts", 0.0)), 1)
            })

        return {
            "records": records,
            "total": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }

    def get_record_by_product_id(self, product_id: str) -> Optional[Dict[str, Any]]:
        if self._df is None:
            self.load_data()
        if self._df is None:
            return None
            
        p_id = product_id.strip().upper()
        matches = self._df[self._df["Product ID"].str.upper() == p_id]
        if matches.empty:
            # Check by UDI
            if p_id.isdigit():
                matches = self._df[self._df["UDI"] == int(p_id)]
        if matches.empty:
            return None
            
        row = matches.iloc[0]
        return {
            "udi": int(row["UDI"]),
            "product_id": str(row["Product ID"]),
            "type": str(row["Type"]),
            "air_temperature": round(float(row["Air temperature [K]"]), 2),
            "process_temperature": round(float(row["Process temperature [K]"]), 2),
            "rotational_speed": round(float(row["Rotational speed [rpm]"]), 1),
            "torque": round(float(row["Torque [Nm]"]), 2),
            "tool_wear": round(float(row["Tool wear [min]"]), 1),
            "target": int(row["Target"]),
            "failure_type": str(row["Failure Type"]),
            "temp_diff": round(float(row.get("Temp_Diff", 0.0)), 2),
            "power_watts": round(float(row.get("Power_Watts", 0.0)), 1)
        }

    def get_analytics_data(self) -> Dict[str, Any]:
        """Returns deep aggregated analytics for dashboard visualizations."""
        if self._df is None:
            self.load_data()
        df = self._df
        if df is None:
            return {}

        # 1. Failure type breakdown by Product Type (L, M, H)
        breakdown_pivot = pd.crosstab(df["Type"], df["Failure Type"]).to_dict(orient="index")

        # 2. Scatter plot sample (All 275 failure rows + 425 random normal rows = 700 points for crisp visual charting)
        failures_df = df[df["Target"] == 1]
        normal_sample = df[df["Target"] == 0].sample(n=min(425, len(df[df["Target"] == 0])), random_state=42)
        scatter_df = pd.concat([failures_df, normal_sample]).sample(frac=1.0, random_state=42)
        
        scatter_points = []
        for _, r in scatter_df.iterrows():
            scatter_points.append({
                "product_id": str(r["Product ID"]),
                "type": str(r["Type"]),
                "air_temp": round(float(r["Air temperature [K]"]), 1),
                "torque": round(float(r["Torque [Nm]"]), 1),
                "speed": round(float(r["Rotational speed [rpm]"]), 0),
                "tool_wear": round(float(r["Tool wear [min]"]), 0),
                "is_failure": bool(r["Target"] == 1),
                "failure_type": str(r["Failure Type"])
            })

        # 3. Correlation Matrix (actual Pearson correlations)
        corr_cols = [
            "Air temperature [K]", "Process temperature [K]",
            "Rotational speed [rpm]", "Torque [Nm]", "Tool wear [min]", "Target", "Temp_Diff"
        ]
        corr_matrix = df[corr_cols].corr().round(3).to_dict()

        # 4. Sensor distribution histograms (Tool wear buckets, Torque buckets, Speed buckets)
        tool_wear_bins = [0, 40, 80, 120, 160, 200, 260]
        tool_wear_labels = ["0-40", "41-80", "81-120", "121-160", "161-200", "201+"]
        df_wear = pd.cut(df["Tool wear [min]"], bins=tool_wear_bins, labels=tool_wear_labels)
        wear_dist = df.groupby([df_wear, "Target"], observed=False).size().unstack(fill_value=0)
        
        wear_chart_data = []
        for label in tool_wear_labels:
            wear_chart_data.append({
                "bin": label,
                "normal": int(wear_dist.loc[label, 0]) if label in wear_dist.index else 0,
                "failure": int(wear_dist.loc[label, 1]) if label in wear_dist.index and 1 in wear_dist.columns else 0
            })

        # Speed vs Torque distributions by Failure Mode
        mode_stats = {}
        for ftype in ["No Failure", "Overstrain Failure", "Power Failure", "Tool Wear Failure"]:
            sub = df[df["Failure Type"] == ftype]
            if not sub.empty:
                mode_stats[ftype] = {
                    "count": len(sub),
                    "avg_torque": round(float(sub["Torque [Nm]"].mean()), 2),
                    "avg_speed": round(float(sub["Rotational speed [rpm]"].mean()), 1),
                    "avg_tool_wear": round(float(sub["Tool wear [min]"].mean()), 1),
                    "avg_temp_diff": round(float(sub["Temp_Diff"].mean()), 2)
                }

        return {
            "breakdown_by_product_type": breakdown_pivot,
            "scatter_points": scatter_points,
            "correlation_matrix": corr_matrix,
            "tool_wear_distribution": wear_chart_data,
            "mode_statistics": mode_stats
        }

dataset_service = DatasetService()
