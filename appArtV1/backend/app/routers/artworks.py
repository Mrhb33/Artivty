from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, Artwork
from ..schemas import Artwork as ArtworkSchema, ArtworkCreate, ArtworkUpdate
from .auth import get_current_user
import boto3
from botocore.exceptions import NoCredentialsError
import os
from decouple import config

router = APIRouter()

# AWS S3 Configuration
AWS_ACCESS_KEY_ID = config("AWS_ACCESS_KEY_ID", default="")
AWS_SECRET_ACCESS_KEY = config("AWS_SECRET_ACCESS_KEY", default="")
AWS_S3_BUCKET_NAME = config("AWS_S3_BUCKET_NAME", default="appart-bucket")
AWS_REGION = config("AWS_REGION", default="us-east-1")

s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

def upload_image_to_s3(file: UploadFile, filename: str) -> str:
    """Upload image to S3 and return public URL"""
    try:
        s3_client.upload_fileobj(
            file.file,
            AWS_S3_BUCKET_NAME,
            filename,
            ExtraArgs={'ACL': 'public-read', 'ContentType': file.content_type}
        )
        return f"https://{AWS_S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{filename}"
    except NoCredentialsError:
        raise HTTPException(status_code=500, detail="AWS credentials not configured")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/", response_model=ArtworkSchema)
def create_artwork(
    artwork_data: ArtworkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new artwork for artist's portfolio"""
    if current_user.role != "artist":
        raise HTTPException(status_code=403, detail="Only artists can upload artworks")

    db_artwork = Artwork(
        artist_id=current_user.id,
        title=artwork_data.title,
        description=artwork_data.description,
        image_url=artwork_data.image_url,
        style_tags=artwork_data.style_tags
    )
    db.add(db_artwork)
    db.commit()
    db.refresh(db_artwork)

    # Update artist verification status (requires 3 artworks + profile + bio)
    if current_user.role == "artist":
        artist_artworks = db.query(Artwork).filter(Artwork.artist_id == current_user.id).count()
        has_profile_complete = (
            current_user.profile_picture_url is not None and
            current_user.bio is not None and
            current_user.bio.strip() != ""
        )
        current_user.is_artist_verified = artist_artworks >= 3 and has_profile_complete
        db.commit()

    return db_artwork

@router.get("/feed", response_model=List[ArtworkSchema])
def get_artwork_feed(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get artwork feed for home screen"""
    artworks = db.query(Artwork).join(User).filter(
        User.is_artist_verified == True
    ).offset(skip).limit(limit).all()
    return artworks

@router.get("/artist/{artist_id}", response_model=List[ArtworkSchema])
def get_artist_artworks(
    artist_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all artworks by a specific artist"""
    artworks = db.query(Artwork).filter(Artwork.artist_id == artist_id).offset(skip).limit(limit).all()
    return artworks

@router.put("/{artwork_id}", response_model=ArtworkSchema)
def update_artwork(
    artwork_id: int,
    artwork_update: ArtworkUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update artwork (only by owner)"""
    artwork = db.query(Artwork).filter(Artwork.id == artwork_id).first()
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")

    if artwork.artist_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    for field, value in artwork_update.dict(exclude_unset=True).items():
        setattr(artwork, field, value)

    db.commit()
    db.refresh(artwork)
    return artwork

@router.delete("/{artwork_id}")
def delete_artwork(
    artwork_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete artwork (only by owner)"""
    artwork = db.query(Artwork).filter(Artwork.id == artwork_id).first()
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")

    if artwork.artist_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(artwork)
    db.commit()

    # Update artist verification status
    artist_artworks = db.query(Artwork).filter(Artwork.artist_id == current_user.id).count()
    if artist_artworks < 3:
        current_user.is_artist_verified = False
        db.commit()

    return {"message": "Artwork deleted"}
