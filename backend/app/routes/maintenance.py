from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import MaintenanceRecord
from app.schemas import MaintenanceCreate, MaintenanceUpdate, MaintenanceResponse

router = APIRouter(prefix="/maintenance", tags=["Maintenance Recommendations"])

@router.get("", response_model=List[MaintenanceResponse])
def get_maintenance_records(
    status: Optional[str] = Query(None, description="Filter by status (Pending, In Progress, Completed, Under Review)"),
    priority: Optional[str] = Query(None, description="Filter by priority (Low, Medium, High, Critical)"),
    asset_id: Optional[str] = Query(None, description="Filter by asset / product ID"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(MaintenanceRecord)
    if status and status != "ALL":
        query = query.filter(MaintenanceRecord.status == status)
    if priority and priority != "ALL":
        query = query.filter(MaintenanceRecord.priority == priority)
    if asset_id:
        query = query.filter(MaintenanceRecord.asset_id.ilike(f"%{asset_id}%"))
        
    records = query.order_by(desc(MaintenanceRecord.created_at)).limit(limit).all()
    return records

@router.post("", response_model=MaintenanceResponse, status_code=201)
def create_maintenance_record(
    record_in: MaintenanceCreate,
    db: Session = Depends(get_db)
):
    new_record = MaintenanceRecord(
        asset_id=record_in.asset_id.upper(),
        issue_observed=record_in.issue_observed,
        priority=record_in.priority,
        assigned_technician=record_in.assigned_technician,
        action_taken=record_in.action_taken,
        status=record_in.status,
        source=record_in.source,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record

@router.patch("/{record_id}", response_model=MaintenanceResponse)
def update_maintenance_record(
    record_id: int = Path(..., description="Maintenance record ID"),
    update_data: MaintenanceUpdate = ...,
    db: Session = Depends(get_db)
):
    record = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Maintenance record #{record_id} not found.")

    if update_data.issue_observed is not None:
        record.issue_observed = update_data.issue_observed
    if update_data.priority is not None:
        record.priority = update_data.priority
    if update_data.assigned_technician is not None:
        record.assigned_technician = update_data.assigned_technician
    if update_data.action_taken is not None:
        record.action_taken = update_data.action_taken
    if update_data.status is not None:
        record.status = update_data.status
        
    record.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(record)
    return record

@router.delete("/{record_id}")
def delete_maintenance_record(
    record_id: int = Path(...),
    db: Session = Depends(get_db)
):
    record = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Maintenance record #{record_id} not found.")
    db.delete(record)
    db.commit()
    return {"message": f"Maintenance record #{record_id} successfully deleted."}
