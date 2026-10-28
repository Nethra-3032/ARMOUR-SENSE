import pytest
from app.services.dataset_service import dataset_service

def test_dataset_loaded():
    summary = dataset_service.get_summary()
    assert summary["total_records"] == 10000
    assert summary["normal_records"] == 9725
    assert summary["failure_records"] == 275
    assert summary["missing_values_count"] == 0
    assert "L" in summary["product_type_distribution"]
    assert "Overstrain Failure" in summary["failure_type_distribution"]

def test_get_records_pagination():
    res = dataset_service.get_records(page=1, page_size=10)
    assert len(res["records"]) == 10
    assert res["total"] == 10000
    assert res["total_pages"] == 1000
    assert "product_id" in res["records"][0]
    assert "air_temperature" in res["records"][0]

def test_get_records_filtering():
    res = dataset_service.get_records(page=1, page_size=20, product_type="H", target=1)
    assert res["total"] > 0
    for r in res["records"]:
        assert r["type"] == "H"
        assert r["target"] == 1

def test_get_record_by_product_id():
    rec = dataset_service.get_record_by_product_id("M10001")
    assert rec is not None
    assert rec["product_id"] == "M10001"
    assert rec["type"] == "M"
    assert rec["udi"] == 1

def test_analytics_data():
    analytics = dataset_service.get_analytics_data()
    assert "breakdown_by_product_type" in analytics
    assert "correlation_matrix" in analytics
    assert "scatter_points" in analytics
    assert len(analytics["scatter_points"]) > 200
