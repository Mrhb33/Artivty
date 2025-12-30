from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class NotificationType(str, Enum):
    NEW_REQUEST = "new_request"
    NEW_OFFER = "new_offer"
    OFFER_ACCEPTED = "offer_accepted"
    OFFER_REJECTED = "offer_rejected"
    REQUEST_COMPLETED = "request_completed"

class NotificationBase(BaseModel):
    type: NotificationType
    title: str
    message: str

class NotificationCreate(NotificationBase):
    user_id: int
    related_request_id: Optional[int]
    related_artist_id: Optional[int]

class Notification(NotificationBase):
    id: int
    user_id: int
    related_request_id: Optional[int]
    related_artist_id: Optional[int]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
