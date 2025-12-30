from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import User
from ..schemas import User as UserSchema, UserUpdate
from .auth import get_current_user

router = APIRouter()

@router.get("/me", response_model=UserSchema)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserSchema)
def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    # Update artist verification status if profile/bio changed
    if current_user.role == "artist" and ('profile_picture_url' in update_data or 'bio' in update_data):
        # TODO: Re-enable when Artwork model is available
        # artist_artworks = db.query(Artwork).filter(Artwork.artist_id == current_user.id).count()
        artist_artworks = 0
        has_profile_complete = (
            current_user.profile_picture_url is not None and
            current_user.bio is not None and
            current_user.bio.strip() != ""
        )
        current_user.is_artist_verified = artist_artworks >= 3 and has_profile_complete

    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/search", response_model=List[UserSchema])
def search_users(
    q: str = "",
    role: str = None,
    eligible_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search users with optional filtering"""
    query = db.query(User)

    # Text search on name or username
    if q:
        query = query.filter(
            (User.name.ilike(f"%{q}%")) |
            (User.username.ilike(f"%{q}%"))
        )

    # Role filter
    if role:
        query = query.filter(User.role == role)

    # Eligible only filter (artists only for now)
    if eligible_only:
        query = query.filter(User.role == "artist").filter(User.is_artist_verified == True)

    # Don't include current user in results
    query = query.filter(User.id != current_user.id)

    users = query.limit(50).all()
    return users
