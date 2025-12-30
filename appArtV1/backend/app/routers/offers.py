from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, Offer, Request, Notification
from ..schemas import Offer as OfferSchema, OfferCreate, OfferWithArtist, NotificationCreate, NotificationType
from .auth import get_current_user

router = APIRouter()

@router.post("/request/{request_id}", response_model=OfferSchema)
async def create_offer(
    request_id: int,
    offer_data: OfferCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create offer for a request (artists only)"""
    if current_user.role != "artist":
        raise HTTPException(status_code=403, detail="Only artists can create offers")

    if not current_user.is_artist_verified:
        raise HTTPException(status_code=403, detail="Artist must be verified to submit offers")

    # Check if request exists and is open
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    if request.status != "open":
        raise HTTPException(status_code=400, detail="Request is not open for offers")

    # Check if artist already submitted an offer for this request
    existing_offer = db.query(Offer).filter(
        Offer.request_id == request_id,
        Offer.artist_id == current_user.id
    ).first()

    if existing_offer:
        raise HTTPException(status_code=400, detail="You already submitted an offer for this request")

    # Create offer
    db_offer = Offer(
        request_id=request_id,
        artist_id=current_user.id,
        **offer_data.dict()
    )
    db.add(db_offer)
    db.commit()
    db.refresh(db_offer)

    # Notify customer
    notification = Notification(
        user_id=request.customer_id,
        type=NotificationType.NEW_OFFER,
        title="New Offer Received",
        message=f"New offer for '{request.title}' from {current_user.name}",
        related_request_id=request_id,
        related_artist_id=current_user.id
    )
    db.add(notification)
    db.commit()

    return db_offer

    return db_offer

@router.get("/request/{request_id}", response_model=List[OfferWithArtist])
async def get_request_offers(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all offers for a request (only for request owner)"""
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    if request.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view offers")

    offers = db.query(Offer).join(User).filter(Offer.request_id == request_id).all()

    # Format offers with artist info
    offers_with_artist = []
    for offer in offers:
        offers_with_artist.append(OfferWithArtist(
            **offer.__dict__,
            artist_name=offer.artist.name,
            artist_username=offer.artist.username,
            artist_profile_picture=offer.artist.profile_picture_url
        ))

    return offers_with_artist

@router.get("/my-offers", response_model=List[OfferSchema])
async def get_my_offers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's offers (artists only)"""
    if current_user.role != "artist":
        raise HTTPException(status_code=403, detail="Only artists can view their offers")

    offers = db.query(Offer).filter(Offer.artist_id == current_user.id).all()
    return offers

@router.delete("/{offer_id}")
async def delete_offer(
    offer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete offer (only by owner, only if request is still open)"""
    offer = db.query(Offer).join(Request).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    if offer.artist_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if offer.request.status != "open":
        raise HTTPException(status_code=400, detail="Cannot delete offer for closed request")

    db.delete(offer)
    db.commit()

    return {"message": "Offer deleted"}
