from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class OfferStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class OfferBase(BaseModel):
    price: float
    delivery_days: int
    message: Optional[str]

class OfferCreate(OfferBase):
    pass

class OfferUpdate(BaseModel):
    status: Optional[OfferStatus]

class Offer(OfferBase):
    id: int
    request_id: int
    artist_id: int
    status: OfferStatus
    created_at: datetime

    class Config:
        from_attributes = True

class OfferWithArtist(Offer):
    artist_name: str
    artist_username: Optional[str]
    artist_profile_picture: Optional[str]

    class Config:
        from_attributes = True
