from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_tenant_org_id
from app.models.user import User
from app.models.workflow import Workflow, WorkflowExecution
from app.schemas.workflow import (
    WorkflowOut,
    WorkflowUpdate,
    WorkflowExecutionOut,
    TriggerWorkflowRequest
)
from app.services.workflow_engine import WorkflowEngine

router = APIRouter(prefix="/workflows", tags=["Workflows"])

@router.get("", response_model=List[WorkflowOut])
def get_workflows(
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Workflow)
    if org_id:
        q = q.filter(Workflow.organization_id == org_id)

    workflows = q.order_by(Workflow.id.asc()).all()
    results = []
    for wf in workflows:
        out = WorkflowOut.from_orm(wf)
        recent_execs = db.query(WorkflowExecution).filter(
            WorkflowExecution.workflow_id == wf.id
        ).order_by(desc(WorkflowExecution.executed_at)).limit(5).all()
        
        exec_list = []
        for ex in recent_execs:
            e_out = WorkflowExecutionOut.from_orm(ex)
            e_out.workflow_name = wf.name
            exec_list.append(e_out)
        out.recent_executions = exec_list
        results.append(out)
    return results

@router.put("/{workflow_id}", response_model=WorkflowOut)
def update_workflow(
    workflow_id: int,
    payload: WorkflowUpdate,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    if org_id and wf.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    for key, val in payload.dict(exclude_unset=True).items():
        setattr(wf, key, val)

    db.commit()
    db.refresh(wf)
    return wf

@router.get("/executions", response_model=List[WorkflowExecutionOut])
def get_workflow_executions(
    workflow_id: Optional[int] = None,
    limit: int = 50,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(WorkflowExecution)
    if org_id:
        q = q.filter(WorkflowExecution.organization_id == org_id)
    if workflow_id:
        q = q.filter(WorkflowExecution.workflow_id == workflow_id)

    executions = q.order_by(desc(WorkflowExecution.executed_at)).limit(limit).all()
    results = []
    for ex in executions:
        out = WorkflowExecutionOut.from_orm(ex)
        if ex.workflow:
            out.workflow_name = ex.workflow.name
        results.append(out)
    return results

@router.post("/trigger")
def trigger_workflow_manually(
    payload: TriggerWorkflowRequest,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    wf = db.query(Workflow).filter(Workflow.id == payload.workflow_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    if org_id and wf.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    test_params = payload.custom_params or {
        "booking_reference": "BK-2026-TEST99",
        "customer_name": "Eleanor Vance",
        "customer_email": "eleanor.vance@example.com",
        "name": "Eleanor Vance",
        "email": "eleanor.vance@example.com",
        "inquiry_text": "Manual demonstration execution test",
        "source": "Manual Trigger Console",
        "experience_title": "Grand Alpine Summit Expedition",
        "total_price": 640.0
    }

    result = WorkflowEngine.execute_workflow(db, wf, test_params)
    return {"message": "Workflow triggered successfully", "result": result}

