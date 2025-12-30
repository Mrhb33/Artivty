from pydantic import BaseModel
from typing import Optional

class DeviceTokenBase(BaseModel):
    token: str
    device_type: Optional[str]

class DeviceTokenCreate(DeviceTokenBase):
    pass

class DeviceToken(DeviceTokenBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
