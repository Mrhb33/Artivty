from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, Request, Offer, ReferenceImage, Notification
from ..schemas import Request as RequestSchema, RequestCreate, RequestUpdate, NotificationCreate, NotificationType
from .auth import get_current_user

router = APIRouter()

@router.post("/", response_model=RequestSchema)
async def create_request(
    request_data: RequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new art request (customers only)"""
    if current_user.role != "customer":
        raise HTTPException(status_code=403, detail="Only customers can create requests")

    # Create request
    db_request = Request(
        customer_id=current_user.id,
        **request_data.dict(exclude={'reference_images'})
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)

    # Add reference images
    if request_data.reference_images:
        for image_url in request_data.reference_images:
            ref_image = ReferenceImage(
                request_id=db_request.id,
                image_url=image_url
            )
            db.add(ref_image)
        db.commit()

    # Notify all eligible artists (verified with complete profiles)
    eligible_artists = db.query(User).filter(
        User.role == "artist",
        User.is_artist_verified == True,
        User.profile_picture_url.isnot(None),
        User.bio.isnot(None),
        User.bio != ""
    ).all()

    for artist in eligible_artists:
        notification = Notification(
            user_id=artist.id,
            type=NotificationType.NEW_REQUEST,
            title="New Art Request",
            message=f"New request: {db_request.title}",
            related_request_id=db_request.id
        )
        db.add(notification)

    db.commit()

    return db_request

@router.get("/my-requests", response_model=List[RequestSchema])
async def get_my_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's requests"""
    requests = db.query(Request).filter(Request.customer_id == current_user.id).all()

    # Add offer counts and reference images
    for request in requests:
        request.offers_count = db.query(Offer).filter(Offer.request_id == request.id).count()
        request.reference_images = [
            img.image_url for img in db.query(ReferenceImage).filter(
                ReferenceImage.request_id == request.id
            ).all()
        ]

    return requests

@router.get("/open", response_model=List[RequestSchema])
async def get_open_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all open requests (for artists)"""
    if current_user.role != "artist":
        raise HTTPException(status_code=403, detail="Only artists can view open requests")

    if not current_user.is_artist_verified:
        raise HTTPException(status_code=403, detail="Artist must be verified to view requests")

    requests = db.query(Request).filter(Request.status == "open").all()

    # Add offer counts and reference images
    for request in requests:
        request.offers_count = db.query(Offer).filter(Offer.request_id == request.id).count()
        request.reference_images = [
            img.image_url for img in db.query(ReferenceImage).filter(
                ReferenceImage.request_id == request.id
            ).all()
        ]

    return requests

@router.get("/{request_id}", response_model=RequestSchema)
async def get_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific request details"""
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    # Check permissions
    if (request.customer_id != current_user.id and
        request.selected_artist_id != current_user.id and
        current_user.role != "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to view this request")

    # Add offer count and reference images
    request.offers_count = db.query(Offer).filter(Offer.request_id == request.id).count()
    request.reference_images = [
        img.image_url for img in db.query(ReferenceImage).filter(
            ReferenceImage.request_id == request.id
        ).all()
    ]

    return request

@router.put("/{request_id}/select-artist/{offer_id}")
async def select_artist(
    request_id: int,
    offer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Select an artist for the request (atomic operation)"""
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    if request.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only request owner can select artist")

    if request.status != "open":
        raise HTTPException(status_code=400, detail="Request is not open")

    # Get the selected offer
    selected_offer = db.query(Offer).filter(
        Offer.id == offer_id,
        Offer.request_id == request_id
    ).first()
    if not selected_offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    # Atomic transaction: update request and all offers
    request.status = "selected"
    request.selected_artist_id = selected_offer.artist_id
    selected_offer.status = "accepted"

    # Reject all other offers
    db.query(Offer).filter(
        Offer.request_id == request_id,
        Offer.id != offer_id
    ).update({"status": "rejected"})

    # Create notifications
    # Notify selected artist
    selected_notification = Notification(
        user_id=selected_offer.artist_id,
        type=NotificationType.OFFER_ACCEPTED,
        title="Offer Accepted!",
        message=f"Your offer for '{request.title}' was accepted",
        related_request_id=request_id
    )
    db.add(selected_notification)

    # Notify rejected artists
    rejected_offers = db.query(Offer).filter(
        Offer.request_id == request_id,
        Offer.id != offer_id
    ).all()

    for offer in rejected_offers:
        rejected_notification = Notification(
            user_id=offer.artist_id,
            type=NotificationType.OFFER_REJECTED,
            title="Offer Not Selected",
            message=f"Your offer for '{request.title}' was not selected",
            related_request_id=request_id
        )
        db.add(rejected_notification)

    db.commit()

    return {"message": "Artist selected successfully"}
