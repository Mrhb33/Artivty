from sqlalchemy import Column, Integer, DateTime, Text, Float, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..database import Base

class OfferStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("requests.id"), nullable=False)
    artist_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    price = Column(Float, nullable=False)
    delivery_days = Column(Integer, nullable=False)
    message = Column(Text, nullable=True)
    status = Column(Enum(OfferStatus), default=OfferStatus.PENDING, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    request = relationship("Request", back_populates="offers")
    artist = relationship("User")
