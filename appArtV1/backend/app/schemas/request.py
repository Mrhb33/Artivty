from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class RequestStatus(str, Enum):
    OPEN = "open"
    SELECTED = "selected"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class RequestBase(BaseModel):
    title: str
    description: str
    dimensions_width: Optional[float]
    dimensions_height: Optional[float]
    dimensions_unit: Optional[str] = "cm"
    style: Optional[str]
    deadline: Optional[datetime]

class RequestCreate(RequestBase):
    reference_images: Optional[List[str]] = []

class RequestUpdate(BaseModel):
    status: Optional[RequestStatus]

class Request(RequestBase):
    id: int
    customer_id: int
    selected_artist_id: Optional[int]
    status: RequestStatus
    created_at: datetime
    updated_at: Optional[datetime]
    offers_count: int = 0
    reference_images: List[str] = []

    class Config:
        from_attributes = True
