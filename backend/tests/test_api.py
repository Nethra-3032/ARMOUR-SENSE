import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["online", "degraded"]
    assert data["dataset_status"]["total_records"] == 10000

def test_dataset_summary_api():
    res = client.get("/api/dataset/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_records"] == 10000
    assert data["normal_records"] == 9725
    assert data["failure_records"] == 275

def test_dataset_records_api():
    res = client.get("/api/dataset/records?page=1&page_size=5")
    assert res.status_code == 200
    data = res.json()
    assert len(data["records"]) == 5
    assert data["total"] == 10000

def test_predict_endpoint_valid():
    payload = {
        "product_type": "M",
        "air_temperature": 298.5,
        "process_temperature": 308.7,
        "rotational_speed": 1500.0,
        "torque": 40.0,
        "tool_wear": 50.0
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "failure_probability" in data
    assert "calibrated_risk_score" in data
    assert "risk_category" in data
    assert "recommended_action" in data
    assert len(data["feature_contributions"]) > 0

def test_predict_endpoint_invalid_input():
    payload = {
        "product_type": "INVALID",
        "air_temperature": 500.0,  # exceeds limit
        "process_temperature": 308.7,
        "rotational_speed": -100.0,
        "torque": 40.0,
        "tool_wear": 50.0
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 422  # Pydantic validation error

def test_model_metrics_api():
    res = client.get("/api/model/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "f1_score" in data
    assert "roc_auc" in data
    assert "confusion_matrix" in data

def test_maintenance_crud():
    # 1. Create
    payload = {
        "asset_id": "TEST_UNIT_99",
        "issue_observed": "Abnormal vibration during spindle test",
        "priority": "High",
        "assigned_technician": "Auto Tester",
        "status": "Pending"
    }
    create_res = client.post("/api/maintenance", json=payload)
    assert create_res.status_code == 201
    created = create_res.json()
    record_id = created["id"]
    assert created["asset_id"] == "TEST_UNIT_99"

    # 2. Read
    list_res = client.get(f"/api/maintenance?asset_id=TEST_UNIT_99")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Update (PATCH)
    patch_res = client.patch(f"/api/maintenance/{record_id}", json={
        "status": "In Progress",
        "action_taken": "Vibration sensor inspected"
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "In Progress"

    # 4. Clean up / Delete
    del_res = client.delete(f"/api/maintenance/{record_id}")
    assert del_res.status_code == 200
