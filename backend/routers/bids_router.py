from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas_trips as trip_schemas
import auth
import uuid
from typing import List

router = APIRouter(prefix="/bids", tags=["Bidding"])

@router.post("/{ride_id}", response_model=trip_schemas.BidResponse, status_code=status.HTTP_201_CREATED)
def place_bid(
    ride_id: str,
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
    
    # Can't bid on own trip
    if trip.passenger_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot bid on your own trip"
        )
    
    # Can only bid on pending or bidding trips
    if trip.status not in [models.TripStatus.PENDING, models.TripStatus.BIDDING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This trip is no longer accepting bids"
        )
    
    # Create bid
    new_bid = models.Bid(
        id=str(uuid.uuid4()),
        trip_id=ride_id,
        driver_id=current_user.id,
        amount=bid_data.amount,
        message=bid_data.message,
        status=models.BidStatus.PENDING
    )
    
    # Update trip status to bidding if it was pending
    if trip.status == models.TripStatus.PENDING:
        trip.status = models.TripStatus.BIDDING
    
    db.add(new_bid)
    db.commit()
    db.refresh(new_bid)
    
    return new_bid

@router.get("/{ride_id}/all", response_model=List[trip_schemas.BidWithDriver])
def get_ride_bids(
    ride_id: str,
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
    
    # Only passenger can see bids
    if trip.passenger_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the trip creator can view bids"
        )
    
    # Get bids with driver info
    bids = db.query(models.Bid, models.User).join(
        models.User, models.Bid.driver_id == models.User.id
    ).filter(models.Bid.trip_id == ride_id).all()
    
    result = []
    for bid, driver in bids:
        result.append({
            "id": bid.id,
            "trip_id": bid.trip_id,
            "driver_id": bid.driver_id,
            "amount": bid.amount,
            "message": bid.message,
            "status": bid.status.value,
            "created_at": bid.created_at,
            "driver_name": driver.full_name,
            "driver_rating": driver.rating,
            "driver_avatar": driver.avatar
        })
    
    return result

@router.post("/{bid_id}/accept", status_code=status.HTTP_200_OK)
def accept_bid(
    bid_id: str,
    current_user: models.User = Depends(auth.require_role(["passenger"])),
    db: Session = Depends(get_db)
):
    # Get bid
    bid = db.query(models.Bid).filter(models.Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bid not found"
        )
    
    # Get trip
    trip = db.query(models.Trip).filter(models.Trip.id == bid.trip_id).first()
    
    # Only trip creator can accept bids
    if trip.passenger_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the trip creator can accept bids"
        )
    
    # Update bid status
    bid.status = models.BidStatus.ACCEPTED
    
    # Update trip with driver and status
    trip.driver_id = bid.driver_id
    trip.price_per_seat = bid.amount
    trip.status = models.TripStatus.ACCEPTED
    
    # Reject all other bids
    other_bids = db.query(models.Bid).filter(
        models.Bid.trip_id == bid.trip_id,
        models.Bid.id != bid_id,
        models.Bid.status == models.BidStatus.PENDING
    ).all()
    
    for other_bid in other_bids:
        other_bid.status = models.BidStatus.REJECTED
    
    # Create OTP for ride start
    import random
    otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    active_ride = models.ActiveRide(
        id=str(uuid.uuid4()),
        trip_id=trip.id,
        otp=otp
    )
    
    db.add(active_ride)
    db.commit()
    
    return {
        "message": "Bid accepted successfully",
        "trip_id": trip.id,
        "otp": otp
    }

@router.post("/{bid_id}/counter", response_model=trip_schemas.BidResponse)
def counter_bid(
    bid_id: str,
    bid_data: trip_schemas.BidCreate,
    current_user: models.User = Depends(auth.require_role(["passenger"])),
    db: Session = Depends(get_db)
):
    # Get original bid
    original_bid = db.query(models.Bid).filter(models.Bid.id == bid_id).first()
    if not original_bid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bid not found"
        )
    
    # Get trip
    trip = db.query(models.Trip).filter(models.Trip.id == original_bid.trip_id).first()
    
    # Only trip creator can counter bids
    if trip.passenger_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the trip creator can counter bids"
        )
    
    # Mark original bid as countered
    original_bid.status = models.BidStatus.COUNTERED
    
    # Create new counter bid
    counter_bid = models.Bid(
        id=str(uuid.uuid4()),
        trip_id=original_bid.trip_id,
        driver_id=original_bid.driver_id,
        amount=bid_data.amount,
        message=f"Counter offer: {bid_data.message or ''}",
        status=models.BidStatus.PENDING
    )
    
    db.add(counter_bid)
    db.commit()
    db.refresh(counter_bid)
    
    return counter_bid
