from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    trigger_event = Column(String(100), nullable=False) 
    # Events: "new_inquiry", "new_booking", "upcoming_experience", "completed_experience", "unanswered_inquiry"
    description = Column(Text, nullable=False)
    action_type = Column(String(100), nullable=False)
    # Actions: "create_crm_record", "booking_confirmation_notification", "experience_reminder", "feedback_request", "followup_task"
    is_enabled = Column(Boolean, default=True)
    execution_count = Column(Integer, default=0)
    last_executed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="workflows")
    executions = relationship("WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan", order_by="desc(WorkflowExecution.executed_at)")

class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    trigger_data = Column(Text, nullable=True) # JSON or text details
    status = Column(String(50), default="SUCCESS") # SUCCESS, FAILED
    execution_message = Column(Text, nullable=False)
    executed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    workflow = relationship("Workflow", back_populates="executions")

