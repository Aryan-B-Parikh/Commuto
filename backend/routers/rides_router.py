from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas_trips as trip_schemas
import auth
import uuid
from typing import List

router = APIRouter(prefix="/rides", tags=["Rides"])

@router.post("/request", response_model=trip_schemas.TripResponse, status_code=status.HTTP_201_CREATED)
def create_ride_request(
    trip_data: trip_schemas.TripCreate,
    current_user: models.User = Depends(auth.require_role(["passenger"])),
    db: Session = Depends(get_db)
):
    # Create new trip
    new_trip = models.Trip(
        id=str(uuid.uuid4()),
        passenger_id=current_user.id,
        from_address=trip_data.from_location.address,
        from_lat=trip_data.from_location.lat,
        from_lng=trip_data.from_location.lng,
        to_address=trip_data.to_location.address,
        to_lat=trip_data.to_location.lat,
        to_lng=trip_data.to_location.lng,
        date=trip_data.date,
        time=trip_data.time,
        seats_requested=trip_data.seats_requested,
        status=models.TripStatus.PENDING
    )
    
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    
    return new_trip

@router.get("/open", response_model=List[trip_schemas.TripResponse])
def get_open_rides(
    current_user: models.User = Depends(auth.require_role(["driver"])),
    db: Session = Depends(get_db)
):
    # Get all pending rides
    rides = db.query(models.Trip).filter(
        models.Trip.status.in_([models.TripStatus.PENDING, models.TripStatus.BIDDING])
    ).all()
    
    return rides

@router.post("/{trip_id}/cancel", status_code=status.HTTP_200_OK)
def cancel_ride(
    trip_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    # Only passenger or driver can cancel
    if trip.passenger_id != current_user.id and trip.driver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to cancel this trip"
        )
    
    # Can't cancel if already completed
    if trip.status == models.TripStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel a completed trip"
        )
    
    trip.status = models.TripStatus.CANCELLED
    db.commit()
    
    return {"message": "Trip cancelled successfully"}
