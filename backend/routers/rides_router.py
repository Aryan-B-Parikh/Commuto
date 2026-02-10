from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas_trips as trip_schemas
import auth
import uuid
from uuid import UUID
from typing import List
from datetime import datetime

router = APIRouter(prefix="/rides", tags=["Rides"])

@router.post("/request", response_model=trip_schemas.TripResponse, status_code=status.HTTP_201_CREATED)
def create_ride_request(
    trip_data: trip_schemas.TripCreate,
    current_user: models.User = Depends(auth.require_role(["passenger"])),
    db: Session = Depends(get_db)
):
    # Parse date and time into datetime
    try:
        start_time = datetime.strptime(f"{trip_data.date} {trip_data.time}", "%Y-%m-%d %H:%M")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date/time format. Use YYYY-MM-DD and HH:MM"
        )
    
    # Create new trip with UUID and updated schema
    new_trip = models.Trip(
        id=uuid.uuid4(),
        origin_address=trip_data.from_location.address,
        origin_lat=trip_data.from_location.lat,
        origin_lng=trip_data.from_location.lng,
        dest_address=trip_data.to_location.address,
        dest_lat=trip_data.to_location.lat,
        dest_lng=trip_data.to_location.lng,
        start_time=start_time,
        total_seats=trip_data.seats_requested,
        available_seats=trip_data.seats_requested,
        price_per_seat=0,  # Will be set when bid is accepted
        status="pending"
    )
    
    # Create booking for the passenger
    booking = models.Booking(
        id=uuid.uuid4(),
        trip_id=new_trip.id,
        passenger_id=current_user.id,
        seats_booked=trip_data.seats_requested,
        total_price=0,
        status="pending",
        payment_status="pending"
    )
    
    db.add(new_trip)
    db.add(booking)
    db.commit()
    db.refresh(new_trip)
    
    # Add seats_requested for backward compatibility
    new_trip.seats_requested = trip_data.seats_requested
    
    new_trip.seats_requested = trip_data.seats_requested
    
    return new_trip

@router.get("/my-trips", response_model=List[trip_schemas.TripResponse])
def get_my_trips(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Find all trips where the user is a passenger (via booking)
    # Join Trip and Booking tables
    trips = db.query(models.Trip).join(
        models.Booking, models.Trip.id == models.Booking.trip_id
    ).filter(
        models.Booking.passenger_id == current_user.id
    ).order_by(models.Trip.created_at.desc()).all()
    
    # Add seats_requested for backward compatibility
    # Add additional info
    for trip in trips:
        trip.seats_requested = trip.total_seats
        
        # Populate driver details if driver is assigned
        if trip.driver and trip.driver.user:
            trip.driver_name = trip.driver.user.full_name
            trip.driver_avatar = trip.driver.user.avatar_url
            trip.driver_rating = float(trip.driver.rating) if trip.driver.rating else None
        
    return trips


@router.get("/open", response_model=List[trip_schemas.TripResponse])
def get_open_rides(
    current_user: models.User = Depends(auth.require_role(["driver"])),
    db: Session = Depends(get_db)
):
    # Get all pending rides
    rides = db.query(models.Trip).filter(
        models.Trip.status.in_(["pending", "active"])
    ).all()
    
    # Add seats_requested for each trip
    for ride in rides:
        ride.seats_requested = ride.total_seats
        
        # Populate driver details if driver is assigned
        if ride.driver and ride.driver.user:
            ride.driver_name = ride.driver.user.full_name
            ride.driver_avatar = ride.driver.user.avatar_url
            ride.driver_rating = float(ride.driver.rating) if ride.driver.rating else None
    
    return rides

@router.post("/{trip_id}/cancel", status_code=status.HTTP_200_OK)
def cancel_ride(
    trip_id: UUID,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    # Check if user is the driver or a passenger
    is_driver = (trip.driver_id == current_user.id) if trip.driver_id else False
    is_passenger = db.query(models.Booking).filter(
        models.Booking.trip_id == trip_id,
        models.Booking.passenger_id == current_user.id
    ).first() is not None
    
    if not is_driver and not is_passenger:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to cancel this trip"
        )
    
    # Can't cancel if already completed
    if trip.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel a completed trip"
        )
    
    trip.status = "cancelled"
    db.commit()
    
    return {"message": "Trip cancelled successfully"}
