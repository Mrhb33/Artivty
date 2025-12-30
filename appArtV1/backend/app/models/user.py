from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..database import Base

class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    ARTIST = "artist"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    is_active = Column(Boolean, default=True)
    profile_picture_url = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    is_artist_verified = Column(Boolean, default=False)  # Must have 3+ artworks
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships - commented out until other models are available
    # artworks = relationship("Artwork", back_populates="artist")
    # customer_requests = relationship("Request", foreign_keys="Request.customer_id")
    # artist_requests = relationship("Request", foreign_keys="Request.selected_artist_id")
    # offers = relationship("Offer")
    # notifications = relationship("Notification", foreign_keys="Notification.user_id")
    # device_tokens = relationship("DeviceToken")
