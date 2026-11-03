from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class WorkflowBase(BaseModel):
    name: str
    trigger_event: str
    description: str
    action_type: str
    is_enabled: bool = True

class WorkflowUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    name: Optional[str] = None
    description: Optional[str] = None

class WorkflowExecutionOut(BaseModel):
    id: int
    workflow_id: int
    organization_id: int
    trigger_data: Optional[str] = None
    status: str
    execution_message: str
    executed_at: datetime
    workflow_name: Optional[str] = None

    class Config:
        from_attributes = True

class WorkflowOut(WorkflowBase):
    id: int
    organization_id: int
    execution_count: int
    last_executed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    recent_executions: List[WorkflowExecutionOut] = []

    class Config:
        from_attributes = True

class TriggerWorkflowRequest(BaseModel):
    workflow_id: int
    custom_params: Optional[dict] = None

