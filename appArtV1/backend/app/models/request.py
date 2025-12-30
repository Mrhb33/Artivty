from sqlalchemy import Column, Integer, String, DateTime, Text, Float, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..database import Base

class RequestStatus(str, enum.Enum):
    OPEN = "open"
    SELECTED = "selected"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    selected_artist_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    dimensions_width = Column(Float, nullable=True)
    dimensions_height = Column(Float, nullable=True)
    dimensions_unit = Column(String, default="cm", nullable=True)  # cm, inches, etc.
    style = Column(String, nullable=True)
    deadline = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(RequestStatus), default=RequestStatus.OPEN, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id])
    selected_artist = relationship("User", foreign_keys=[selected_artist_id])
    offers = relationship("Offer", back_populates="request")
    reference_images = relationship("ReferenceImage", back_populates="request")
