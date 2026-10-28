from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Path
from app.services.dataset_service import dataset_service

router = APIRouter(prefix="/dataset", tags=["Dataset"])

@router.get("/summary")
def get_dataset_summary():
    summary = dataset_service.get_summary()
    if not summary:
        raise HTTPException(status_code=500, detail="Dataset summary could not be retrieved.")
    return summary

@router.get("/records")
def get_dataset_records(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Records per page"),
    search: Optional[str] = Query(None, description="Search Product ID or UDI"),
    product_type: Optional[str] = Query(None, description="Filter by Type (L, M, H, or ALL)"),
    failure_type: Optional[str] = Query(None, description="Filter by failure label"),
    target: Optional[int] = Query(None, ge=0, le=1, description="Filter by Target (0 or 1)"),
    min_speed: Optional[float] = Query(None, description="Minimum RPM"),
    max_speed: Optional[float] = Query(None, description="Maximum RPM"),
    min_torque: Optional[float] = Query(None, description="Minimum Torque"),
    max_torque: Optional[float] = Query(None, description="Maximum Torque"),
    sort_by: str = Query("udi", description="Sort field"),
    sort_order: str = Query("asc", description="Sort order: asc or desc")
):
    return dataset_service.get_records(
        page=page,
        page_size=page_size,
        search=search,
        product_type=product_type,
        failure_type=failure_type,
        target=target,
        min_speed=min_speed,
        max_speed=max_speed,
        min_torque=min_torque,
        max_torque=max_torque,
        sort_by=sort_by,
        sort_order=sort_order
    )

@router.get("/records/{product_id}")
def get_record_by_product_id(product_id: str = Path(..., description="Product ID or UDI")):
    record = dataset_service.get_record_by_product_id(product_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Equipment record '{product_id}' not found in dataset.")
    return record

@router.get("/analytics")
def get_dataset_analytics():
    analytics = dataset_service.get_analytics_data()
    if not analytics:
        raise HTTPException(status_code=500, detail="Analytics data could not be compiled.")
    return analytics
