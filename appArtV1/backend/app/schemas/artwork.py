from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ArtworkBase(BaseModel):
    title: Optional[str]
    description: Optional[str]
    style_tags: Optional[str]

class ArtworkCreate(ArtworkBase):
    image_url: str

class ArtworkUpdate(ArtworkBase):
    pass

class Artwork(ArtworkBase):
    id: int
    artist_id: int
    image_url: str
    created_at: datetime

    class Config:
        from_attributes = True
