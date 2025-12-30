from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    CUSTOMER = "customer"
    ARTIST = "artist"
    ADMIN = "admin"

class UserBase(BaseModel):
    email: EmailStr
    name: str
    username: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.CUSTOMER

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None

class User(UserBase):
    id: int
    role: UserRole
    is_active: bool
    profile_picture_url: Optional[str]
    bio: Optional[str]
    is_artist_verified: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class UserInDB(User):
    hashed_password: str

class ArtistProfile(User):
    artworks_count: int = 0

    class Config:
        from_attributes = True
