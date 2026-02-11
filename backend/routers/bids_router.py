from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, DBAPIError
from database import get_db
from rate_limiter import rate_limit
import models
import schemas_trips as trip_schemas
import auth
import uuid
import random
import logging
from typing import List
from uuid import UUID

router = APIRouter(prefix="/bids", tags=["Bidding"])
logger = logging.getLogger(__name__)


@router.post("/{ride_id}", response_model=trip_schemas.BidResponse, status_code=status.HTTP_201_CREATED)
@rate_limit(max_requests=5, window_seconds=60, key_suffix="place_bid")
def place_bid(
    request: Request,
    ride_id: UUID,
    bid_data: trip_schemas.BidCreate,
    current_user: models.User = Depends(auth.require_role(["driver"])),
    db: Session = Depends(get_db)
):
    """Place a bid on a trip with rate limiting (5 per minute per IP)"""
    
    # Check if trip exists and is available for bidding
    trip = db.query(models.Trip).filter(
        models.Trip.id == ride_id,
        models.Trip.status.in_(["pending", "active"])
    ).first()
    
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found or no longer accepting bids"
        )
    
    # Check if user is the passenger (can't bid on own trip)
    is_passenger = db.query(models.Booking).filter(
        models.Booking.trip_id == ride_id,
        models.Booking.passenger_id == current_user.id
    ).first() is not None
    
    if is_passenger:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot bid on your own trip"
        )
    
    # Get driver profile
    driver = db.query(models.Driver).filter(models.Driver.user_id == current_user.id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver profile not found"
        )
    
    # Check if driver already has a pending bid on this trip
    existing_bid = db.query(models.TripBid).filter(
        models.TripBid.trip_id == ride_id,
        models.TripBid.driver_id == current_user.id,
        models.TripBid.status == "pending"
    ).first()
    
    if existing_bid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a pending bid on this trip"
        )
    
    # Create bid using TripBid model
    new_bid = models.TripBid(
        id=uuid.uuid4(),
        trip_id=ride_id,
        driver_id=current_user.id,
        bid_amount=bid_data.amount,
        status="pending",
        version=0
    )
    
    try:
        db.add(new_bid)
        db.commit()
        db.refresh(new_bid)
        logger.info(f"Bid created: {new_bid.id} by driver {current_user.id} for trip {ride_id}")
        return new_bid
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error creating bid: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Failed to create bid due to concurrent modification"
        )


@router.get("/{ride_id}/all", response_model=List[trip_schemas.BidWithDriver])
@rate_limit(max_requests=30, window_seconds=60, key_suffix="get_bids")
def get_ride_bids(
    request: Request,
    ride_id: UUID,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all bids for a trip (passenger only)"""
    
    # Check trip exists
    trip = db.query(models.Trip).filter(models.Trip.id == ride_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    # Check if user is the passenger
    is_passenger = db.query(models.Booking).filter(
        models.Booking.trip_id == ride_id,
        models.Booking.passenger_id == current_user.id
    ).first() is not None
    
    if not is_passenger:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the trip creator can view bids"
        )
    
    # Get bids with driver info - join through Driver to User
    bids = db.query(models.TripBid, models.User, models.Driver).join(
        models.Driver, models.TripBid.driver_id == models.Driver.user_id
    ).join(
        models.User, models.Driver.user_id == models.User.id
    ).filter(models.TripBid.trip_id == ride_id).all()
    
    result = []
    for bid, user, driver in bids:
        result.append({
            "id": bid.id,
            "trip_id": bid.trip_id,
            "driver_id": bid.driver_id,
            "bid_amount": bid.bid_amount,
            "status": bid.status,
            "created_at": bid.created_at,
            "driver_name": user.full_name,
            "driver_rating": driver.rating,
            "driver_avatar": user.avatar_url
        })
    
    return result


@router.post("/{bid_id}/accept", status_code=status.HTTP_200_OK)
@rate_limit(max_requests=10, window_seconds=60, key_suffix="accept_bid")
def accept_bid(
    request: Request,
    bid_id: UUID,
    current_user: models.User = Depends(auth.require_role(["passenger"])),
    db: Session = Depends(get_db)
):
    """Accept a bid with database transaction and optimistic locking"""
    
    try:
        # Start transaction with serializable isolation for consistency
        db.begin_nested()
        
        # Get bid with lock to prevent concurrent modifications
        bid = db.query(models.TripBid).filter(
            models.TripBid.id == bid_id
        ).with_for_update().first()
        
        if not bid:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bid not found"
            )
        
        # Get trip with lock
        trip = db.query(models.Trip).filter(
            models.Trip.id == bid.trip_id
        ).with_for_update().first()
        
        # Check if user is the passenger
        is_passenger = db.query(models.Booking).filter(
            models.Booking.trip_id == bid.trip_id,
            models.Booking.passenger_id == current_user.id
        ).first() is not None
        
        if not is_passenger:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the trip creator can accept bids"
            )
        
        # Check if trip is still available
        if trip.status not in ["pending", "active"]:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This trip is no longer accepting bids"
            )
        
        # Check if bid is still pending
        if bid.status != "pending":
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Bid is already {bid.status}"
            )
        
        # Optimistic locking check
        current_version = trip.version
        
        # Update bid status
        bid.status = "accepted"
        bid.version += 1
        
        # Update trip with driver and price
        trip.driver_id = bid.driver_id
        trip.price_per_seat = bid.bid_amount
        trip.status = "active"
        trip.version = current_version + 1  # Increment version for optimistic locking
        
        # Generate OTP for ride start
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        trip.start_otp = otp
        trip.otp_verified = False
        trip.payment_status = "pending"
        
        # Reject all other pending bids
        other_bids = db.query(models.TripBid).filter(
            models.TripBid.trip_id == bid.trip_id,
            models.TripBid.id != bid_id,
            models.TripBid.status == "pending"
        ).with_for_update().all()
        
        for other_bid in other_bids:
            other_bid.status = "rejected"
            other_bid.version += 1
        
        # Update booking with price
        booking = db.query(models.Booking).filter(
            models.Booking.trip_id == trip.id,
            models.Booking.passenger_id == current_user.id
        ).with_for_update().first()
        
        if booking:
            booking.total_price = bid.bid_amount * booking.seats_booked
            booking.status = "confirmed"
        
        # Commit the transaction
        db.commit()
        
        logger.info(f"Bid {bid_id} accepted by passenger {current_user.id} for trip {trip.id}")
        
        return {
            "message": "Bid accepted successfully",
            "trip_id": str(trip.id),
            "otp": otp
        }
        
    except DBAPIError as e:
        db.rollback()
        logger.error(f"Database error (possible optimistic locking conflict): {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bid was modified by another user. Please refresh and try again."
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error accepting bid: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to accept bid"
        )


@router.post("/{bid_id}/counter", response_model=trip_schemas.BidResponse)
@rate_limit(max_requests=10, window_seconds=60, key_suffix="counter_bid")
def counter_bid(
    request: Request,
    bid_id: UUID,
    bid_data: trip_schemas.BidCreate,
    current_user: models.User = Depends(auth.require_role(["passenger"])),
    db: Session = Depends(get_db)
):
    """Counter a bid with transaction safety"""
    
    try:
        db.begin_nested()
        
        # Get original bid with lock
        original_bid = db.query(models.TripBid).filter(
            models.TripBid.id == bid_id
        ).with_for_update().first()
        
        if not original_bid:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bid not found"
            )
        
        # Check if user is the passenger
        is_passenger = db.query(models.Booking).filter(
            models.Booking.trip_id == original_bid.trip_id,
            models.Booking.passenger_id == current_user.id
        ).first() is not None
        
        if not is_passenger:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the trip creator can counter bids"
            )
        
        # Check if bid is still pending
        if original_bid.status != "pending":
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot counter a bid that is already {original_bid.status}"
            )
        
        # Mark original bid as rejected
        original_bid.status = "rejected"
        original_bid.version += 1
        
        # Create new counter bid
        counter_bid_obj = models.TripBid(
            id=uuid.uuid4(),
            trip_id=original_bid.trip_id,
            driver_id=original_bid.driver_id,
            bid_amount=bid_data.amount,
            status="pending",
            is_counter_bid=True,
            parent_bid_id=original_bid.id,
            version=0
        )
        
        db.add(counter_bid_obj)
        db.commit()
        db.refresh(counter_bid_obj)
        
        logger.info(f"Counter bid created: {counter_bid_obj.id} for trip {original_bid.trip_id}")
        
        return counter_bid_obj
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating counter bid: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create counter bid"
        )
