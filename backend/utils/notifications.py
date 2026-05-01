import models
from sqlalchemy.orm import Session
from routers.websocket_router import manager
import logging
from typing import Optional

logger = logging.getLogger(__name__)

async def create_notification(
    db: Session,
    user_id: str,
    title: str,
    message: str,
    notification_type: str,
    link: Optional[str] = None
):
    """
    Creates a notification in the database and sends it via WebSocket if user is connected.
    """
    try:
        # 1. Create DB record
        db_notification = models.Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notification_type,
            link=link
        )
        db.add(db_notification)
        db.commit()
        db.refresh(db_notification)
        
        # 2. Prepare WebSocket message
        ws_message = {
            "type": "notification",
            "data": {
                "id": str(db_notification.id),
                "title": title,
                "message": message,
                "type": notification_type,
                "link": link,
                "created_at": db_notification.created_at.isoformat()
            }
        }
        
        # 3. Send via WebSocket
        await manager.send_personal_message(ws_message, str(user_id))
        
        return db_notification
    except Exception as e:
        logger.error(f"Error creating notification for user {user_id}: {str(e)}")
        db.rollback()
        return None
