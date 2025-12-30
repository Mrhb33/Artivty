from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..database import Base

class NotificationType(str, enum.Enum):
    NEW_REQUEST = "new_request"
    NEW_OFFER = "new_offer"
    OFFER_ACCEPTED = "offer_accepted"
    OFFER_REJECTED = "offer_rejected"
    REQUEST_COMPLETED = "request_completed"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    related_request_id = Column(Integer, ForeignKey("requests.id"), nullable=True)
    related_artist_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    related_request = relationship("Request", foreign_keys=[related_request_id])
    related_artist = relationship("User", foreign_keys=[related_artist_id])
