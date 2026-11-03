from datetime import datetime, timezone
import json
from sqlalchemy.orm import Session
from app.models.workflow import Workflow, WorkflowExecution
from app.models.notification import Notification
from app.models.customer import Customer
from app.models.lead import Lead
from app.models.interaction import CustomerInteraction
from app.models.booking import Booking

class WorkflowEngine:
    """
    Automates tourism business workflows across inquiries, bookings, experiences, and CRM tasks.
    """
    
    @staticmethod
    def trigger_event(db: Session, organization_id: int, event_name: str, payload: dict) -> list:
        """
        Finds active workflows configured for `event_name` in `organization_id` and executes them.
        """
        workflows = db.query(Workflow).filter(
            Workflow.organization_id == organization_id,
            Workflow.trigger_event == event_name,
            Workflow.is_enabled == True
        ).all()
        
        execution_results = []
        for wf in workflows:
            res = WorkflowEngine.execute_workflow(db, wf, payload)
            execution_results.append(res)
            
        return execution_results

    @staticmethod
    def execute_workflow(db: Session, workflow: Workflow, payload: dict) -> dict:
        status_code = "SUCCESS"
        message = ""
        
        try:
            # 1. New Customer Inquiry -> Auto CRM record
            if workflow.trigger_event == "new_inquiry" or workflow.action_type == "create_crm_record":
                lead_name = payload.get("name", "New Lead")
                lead_email = payload.get("email", "")
                lead_text = payload.get("inquiry_text", "")
                source = payload.get("source", "Website Inquiry")
                
                # Check if customer exists, or link
                customer = db.query(Customer).filter(
                    Customer.organization_id == workflow.organization_id,
                    Customer.email == lead_email
                ).first()
                
                if customer:
                    interaction = CustomerInteraction(
                        organization_id=workflow.organization_id,
                        customer_id=customer.id,
                        interaction_type="Inquiry",
                        subject=f"Inquiry received via {source}",
                        notes=lead_text or "Automated CRM capture from digital inquiry",
                        outcome="Awaiting Follow-up"
                    )
                    db.add(interaction)
                    
                notif = Notification(
                    organization_id=workflow.organization_id,
                    title="New Customer Inquiry Captured",
                    message=f"Inquiry received from {lead_name} ({lead_email}). CRM record linked and team notified.",
                    notification_type="inquiry",
                    link="/crm"
                )
                db.add(notif)
                message = f"Created CRM lead interaction and alert for {lead_name} ({lead_email})."

            # 2. New Booking -> Generate Confirmation Notification
            elif workflow.trigger_event == "new_booking" or workflow.action_type == "booking_confirmation_notification":
                booking_ref = payload.get("booking_reference", "New Booking")
                customer_name = payload.get("customer_name", "Valued Guest")
                total_price = payload.get("total_price", 0.0)
                
                notif = Notification(
                    organization_id=workflow.organization_id,
                    title=f"Booking Confirmation: {booking_ref}",
                    message=f"Booking {booking_ref} confirmed for {customer_name}. Total: ${total_price:.2f}. Digital voucher dispatched.",
                    notification_type="booking",
                    link="/bookings"
                )
                db.add(notif)
                message = f"Confirmation notification and simulated guest confirmation dispatched for {booking_ref}."

            # 3. Upcoming Experience -> Generate Reminder
            elif workflow.trigger_event == "upcoming_experience" or workflow.action_type == "experience_reminder":
                exp_title = payload.get("experience_title", "Scheduled Tour")
                guest_count = payload.get("guest_count", 1)
                tour_date = payload.get("tour_date", "Tomorrow")
                
                notif = Notification(
                    organization_id=workflow.organization_id,
                    title="Tour Departure Reminder",
                    message=f"Reminder: '{exp_title}' scheduled for {tour_date} with {guest_count} participant(s). Guide briefed.",
                    notification_type="info",
                    link="/experiences"
                )
                db.add(notif)
                message = f"Sent departure preparation reminder for '{exp_title}' to operations staff."

            # 4. Completed Experience -> Customer Feedback Request
            elif workflow.trigger_event == "completed_experience" or workflow.action_type == "feedback_request":
                booking_ref = payload.get("booking_reference", "Recent Tour")
                customer_email = payload.get("customer_email", "")
                
                notif = Notification(
                    organization_id=workflow.organization_id,
                    title="Feedback Survey Dispatched",
                    message=f"Automated post-tour satisfaction questionnaire sent to guest for booking {booking_ref}.",
                    notification_type="workflow",
                    link="/analytics"
                )
                db.add(notif)
                message = f"Triggered digital feedback solicitation survey for booking {booking_ref}."

            # 5. Unanswered Inquiry -> Follow-up Task
            elif workflow.trigger_event == "unanswered_inquiry" or workflow.action_type == "followup_task":
                lead_name = payload.get("name", "Pending Lead")
                days_pending = payload.get("days_pending", 2)
                
                notif = Notification(
                    organization_id=workflow.organization_id,
                    title="Inquiry SLA Alert: Follow-up Required",
                    message=f"Lead from {lead_name} has been pending response for {days_pending} days. Priority task logged.",
                    notification_type="warning",
                    link="/crm"
                )
                db.add(notif)
                message = f"Escalated inquiry from {lead_name} into high-priority follow-up task."

            else:
                message = f"Custom automated step executed for trigger '{workflow.trigger_event}'."

            # Update workflow counters
            workflow.execution_count += 1
            workflow.last_executed_at = datetime.now(timezone.utc)
            db.commit()

        except Exception as e:
            status_code = "FAILED"
            message = f"Execution error: {str(e)}"
            db.rollback()

        # Log execution
        execution = WorkflowExecution(
            workflow_id=workflow.id,
            organization_id=workflow.organization_id,
            trigger_data=json.dumps(payload),
            status=status_code,
            execution_message=message,
            executed_at=datetime.now(timezone.utc)
        )
        db.add(execution)
        db.commit()
        db.refresh(execution)
        
        return {
            "workflow_id": workflow.id,
            "status": status_code,
            "message": message,
            "executed_at": execution.executed_at.isoformat()
        }

