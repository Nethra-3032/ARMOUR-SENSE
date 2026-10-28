from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings:
    PROJECT_NAME: str = "ARMORSENSE - AI Predictive Maintenance Command Center"
    PROJECT_VERSION: str = "1.0.0"
    TAGLINE: str = "Intelligence Before Failure."
    
    # Paths
    BASE_DIR: Path = BASE_DIR
    DATA_DIR: Path = BASE_DIR / "data"
    MODELS_DIR: Path = BASE_DIR / "models"
    
    DATASET_FILENAME: str = "predictive_maintenance_10000_rows_10_columns (2).xlsx"
    DATASET_PATH: Path = DATA_DIR / DATASET_FILENAME
    FALLBACK_DATASET_PATH: Path = DATA_DIR / "dataset.xlsx"
    
    MODEL_PATH: Path = MODELS_DIR / "armorsense_models.joblib"
    METRICS_PATH: Path = MODELS_DIR / "evaluation_metrics.json"
    
    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'armorsense.db'}"
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    
    # Prototype Operational Thresholds (Configurable)
    THRESHOLD_LOW: float = 0.20
    THRESHOLD_MODERATE: float = 0.45
    THRESHOLD_HIGH: float = 0.70
    THRESHOLD_CRITICAL: float = 0.85
    
    # Feature bounds (for out-of-distribution detection)
    BOUNDS = {
        "air_temperature": {"min": 290.0, "max": 315.0, "unit": "K"},
        "process_temperature": {"min": 298.0, "max": 325.0, "unit": "K"},
        "rotational_speed": {"min": 400.0, "max": 3000.0, "unit": "rpm"},
        "torque": {"min": 3.0, "max": 90.0, "unit": "Nm"},
        "tool_wear": {"min": 0.0, "max": 260.0, "unit": "min"}
    }

settings = Settings()
