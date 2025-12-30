from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Artwork(Base):
    __tablename__ = "artworks"

    id = Column(Integer, primary_key=True, index=True)
    artist_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=False)
    style_tags = Column(String, nullable=True)  # Comma-separated tags
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships - commented out until User.artworks is enabled
    # artist = relationship("User", back_populates="artworks")
