from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas_trips as trip_schemas
import auth
import uuid
from typing import List
from uuid import UUID

router = APIRouter(prefix="/bids", tags=["Bidding"])

@router.post("/{ride_id}", response_model=trip_schemas.BidResponse, status_code=status.HTTP_201_CREATED)
def place_bid(
    ride_id: UUID,
    bid_data: trip_schemas.BidCreate,
    current_user: models.User = Depends(auth.require_role(["driver"])),
    db: Session = Depends(get_db)
):
    # Check if trip exists
    trip = db.query(models.Trip).filter(models.Trip.id == ride_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
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
    
    # Can only bid on pending or active trips
    if trip.status not in ["pending", "active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This trip is no longer accepting bids"
        )
    
    # Get driver profile
    driver = db.query(models.Driver).filter(models.Driver.user_id == current_user.id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver profile not found"
        )
    
    # Create bid using TripBid model
    new_bid = models.TripBid(
        id=uuid.uuid4(),
        trip_id=ride_id,
        driver_id=current_user.id,  # This references drivers.user_id
        bid_amount=bid_data.amount,
        status="pending"
    )
    
    db.add(new_bid)
    db.commit()
    db.refresh(new_bid)
    
    return new_bid

@router.get("/{ride_id}/all", response_model=List[trip_schemas.BidWithDriver])
def get_ride_bids(
    ride_id: UUID,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
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
            "driver_avatar": user.avatar
        })
    
    return result

@router.post("/{bid_id}/accept", status_code=status.HTTP_200_OK)
def accept_bid(
    bid_id: UUID,
    current_user: models.User = Depends(auth.require_role(["passenger"])),
    db: Session = Depends(get_db)
):
    # Get bid
    bid = db.query(models.TripBid).filter(models.TripBid.id == bid_id).first()
    if not bid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bid not found"
        )
    
    # Get trip
    trip = db.query(models.Trip).filter(models.Trip.id == bid.trip_id).first()
    
    # Check if user is the passenger
    is_passenger = db.query(models.Booking).filter(
        models.Booking.trip_id == bid.trip_id,
        models.Booking.passenger_id == current_user.id
    ).first() is not None
    
    if not is_passenger:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the trip creator can accept bids"
        )
    
    # Update bid status
    bid.status = "accepted"
    
    # Update trip with driver and price
    trip.driver_id = bid.driver_id
    trip.price_per_seat = bid.bid_amount
    trip.status = "active"
    
    # Generate OTP for ride start
    import random
    otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    trip.start_otp = otp
    trip.otp_verified = False
    
    # Reject all other bids
    other_bids = db.query(models.TripBid).filter(
        models.TripBid.trip_id == bid.trip_id,
        models.TripBid.id != bid_id,
        models.TripBid.status == "pending"
    ).all()
    
    for other_bid in other_bids:
        other_bid.status = "rejected"
    
    # Update booking with price
    booking = db.query(models.Booking).filter(
        models.Booking.trip_id == trip.id,
        models.Booking.passenger_id == current_user.id
    ).first()
    
    if booking:
        booking.total_price = bid.bid_amount * booking.seats_booked
        booking.status = "confirmed"
    
    db.commit()
    
    return {
        "message": "Bid accepted successfully",
        "trip_id": str(trip.id),
        "otp": otp
    }

@router.post("/{bid_id}/counter", response_model=trip_schemas.BidResponse)
def counter_bid(
    bid_id: UUID,
    bid_data: trip_schemas.BidCreate,
    current_user: models.User = Depends(auth.require_role(["passenger"])),
    db: Session = Depends(get_db)
):
    # Get original bid
    original_bid = db.query(models.TripBid).filter(models.TripBid.id == bid_id).first()
    if not original_bid:
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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the trip creator can counter bids"
        )
    
    # Mark original bid as rejected (NeonDB doesn't have "countered" status)
    original_bid.status = "rejected"
    
    # Create new counter bid
    counter_bid_obj = models.TripBid(
        id=uuid.uuid4(),
        trip_id=original_bid.trip_id,
        driver_id=original_bid.driver_id,
        bid_amount=bid_data.amount,
        status="pending"
    )
    
    db.add(counter_bid_obj)
    db.commit()
    db.refresh(counter_bid_obj)
    
    return counter_bid_obj
