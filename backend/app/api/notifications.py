from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_tenant_org_id
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationOut

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationOut])
def get_notifications(
    unread_only: bool = False,
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Notification)
    if org_id:
        q = q.filter(Notification.organization_id == org_id)
    if unread_only:
        q = q.filter(Notification.is_read == False)

    return q.order_by(desc(Notification.created_at)).limit(30).all()

@router.put("/{notif_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif

@router.put("/read-all")
def mark_all_notifications_read(
    org_id: Optional[int] = Depends(get_tenant_org_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    effective_org_id = org_id or current_user.organization_id
    q = db.query(Notification)
    if effective_org_id:
        q = q.filter(Notification.organization_id == effective_org_id)
    
    q.update({Notification.is_read: True})
    db.commit()
    return {"message": "All notifications marked as read"}

