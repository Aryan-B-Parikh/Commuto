from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
from rate_limiter import rate_limit
import models
import schemas_trips as trip_schemas
import auth
import uuid
from uuid import UUID
from typing import List, Optional
from datetime import datetime
import logging

router = APIRouter(prefix="/rides", tags=["Rides"])
logger = logging.getLogger(__name__)


@router.post("/request", response_model=trip_schemas.TripResponse, status_code=status.HTTP_201_CREATED)
@rate_limit(max_requests=5, window_seconds=60, key_suffix="create_trip")
def create_ride_request(
    request: Request,
    trip_data: trip_schemas.TripCreate,
    current_user: models.User = Depends(auth.require_role(["passenger"])),
    db: Session = Depends(get_db)
):
    """Create a ride request with rate limiting (5 per minute)"""
    
    # Parse date and time into datetime
    try:
        start_time = datetime.strptime(f"{trip_data.date} {trip_data.time}", "%Y-%m-%d %H:%M")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date/time format. Use YYYY-MM-DD and HH:MM"
        )
    
    # Validate start time is in the future
    if start_time < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trip start time must be in the future"
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
        status="pending",
        version=0
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
    
    try:
        db.add(new_trip)
        db.add(booking)
        db.commit()
        db.refresh(new_trip)
        
        # Add seats_requested for backward compatibility
        new_trip.seats_requested = trip_data.seats_requested
        
        logger.info(f"Trip created: {new_trip.id} by passenger {current_user.id}")
        
        return new_trip
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating trip: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create trip"
        )


@router.get("/my-trips", response_model=List[trip_schemas.TripResponse])
@rate_limit(max_requests=30, window_seconds=60, key_suffix="my_trips")
def get_my_trips(
    request: Request,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all trips for current user (as passenger)"""
    
    # Find all trips where the user is a passenger (via booking)
    trips = db.query(models.Trip).join(
        models.Booking, models.Trip.id == models.Booking.trip_id
    ).filter(
        models.Booking.passenger_id == current_user.id
    ).order_by(models.Trip.created_at.desc()).all()
    
    # Add seats_requested for backward compatibility
    for trip in trips:
        trip.seats_requested = trip.total_seats
        
        # Populate driver details if driver is assigned
        if trip.driver and trip.driver.user:
            trip.driver_name = trip.driver.user.full_name
            trip.driver_avatar = trip.driver.user.avatar_url
            trip.driver_rating = float(trip.driver.rating) if trip.driver.rating else None
        
    return trips


@router.get("/driver-trips", response_model=List[trip_schemas.TripResponse])
@rate_limit(max_requests=30, window_seconds=60, key_suffix="driver_trips")
def get_driver_trips(
    request: Request,
    current_user: models.User = Depends(auth.require_role(["driver"])),
    db: Session = Depends(get_db)
):
    """Get all trips for current driver"""
    
    trips = db.query(models.Trip).filter(
        models.Trip.driver_id == current_user.id
    ).order_by(models.Trip.created_at.desc()).all()
    
    for trip in trips:
        trip.seats_requested = trip.total_seats
        
    return trips


@router.get("/open", response_model=List[trip_schemas.TripResponse])
@rate_limit(max_requests=30, window_seconds=60, key_suffix="open_rides")
def get_open_rides(
    request: Request,
    current_user: models.User = Depends(auth.require_role(["driver"])),
    db: Session = Depends(get_db)
):
    """Get all open rides available for bidding"""
    
    # Get all pending rides
    rides = db.query(models.Trip).filter(
        models.Trip.status.in_(["pending"])
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
@rate_limit(max_requests=10, window_seconds=60, key_suffix="cancel_trip")
def cancel_ride(
    request: Request,
    trip_id: UUID,
    reason: Optional[str] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel a ride with penalty calculation.
    
    Penalties apply for cancellations within 30 minutes of trip start time.
    """
    
    try:
        db.begin_nested()
        
        trip = db.query(models.Trip).filter(
            models.Trip.id == trip_id
        ).with_for_update().first()
        
        if not trip:
            db.rollback()
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
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to cancel this trip"
            )
        
        # Can't cancel if already completed or cancelled
        if trip.status == "completed":
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot cancel a completed trip"
            )
        
        if trip.status == "cancelled":
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Trip is already cancelled"
            )
        
        # Calculate cancellation penalty if within 30 minutes of start
        penalty_amount = 0
        time_until_start = trip.start_time - datetime.utcnow()
        
        if time_until_start.total_seconds() < 1800:  # 30 minutes
            # Calculate penalty (e.g., 20% of trip price or $5 minimum)
            if trip.price_per_seat and trip.price_per_seat > 0:
                penalty_amount = max(float(trip.price_per_seat) * 0.2, 5.0)
            else:
                penalty_amount = 5.0  # Default minimum penalty
        
        # Update trip
        trip.status = "cancelled"
        trip.cancelled_at = datetime.utcnow()
        trip.cancelled_by = current_user.id
        trip.cancellation_reason = reason
        trip.cancellation_penalty = penalty_amount
        trip.version += 1
        
        # Cancel all related bookings
        bookings = db.query(models.Booking).filter(
            models.Booking.trip_id == trip_id
        ).all()
        
        for booking in bookings:
            booking.status = "cancelled"
            booking.payment_status = "cancelled"
        
        # Reject all pending bids
        pending_bids = db.query(models.TripBid).filter(
            models.TripBid.trip_id == trip_id,
            models.TripBid.status == "pending"
        ).all()
        
        for bid in pending_bids:
            bid.status = "rejected"
            bid.version += 1
        
        db.commit()
        
        logger.info(f"Trip {trip_id} cancelled by user {current_user.id}. Penalty: {penalty_amount}")
        
        return {
            "message": "Trip cancelled successfully",
            "trip_id": str(trip_id),
            "penalty_amount": penalty_amount,
            "reason": reason
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error cancelling trip: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel trip"
        )


@router.post("/{trip_id}/location", status_code=status.HTTP_200_OK)
@rate_limit(max_requests=60, window_seconds=60, key_suffix="update_location")
def update_location(
    request: Request,
    trip_id: UUID,
    location_data: trip_schemas.LocationUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update real-time location for a trip.
    Only the assigned driver can update location.
    """
    
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    # Only driver can update location
    if trip.driver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned driver can update location"
        )
    
    # Can only update location for active trips
    if trip.status not in ["active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only update location for active trips"
        )
    
    # Create location record
    location = models.TripLocation(
        id=uuid.uuid4(),
        trip_id=trip_id,
        latitude=location_data.lat,
        longitude=location_data.lng,
        timestamp=datetime.utcnow()
    )
    
    try:
        db.add(location)
        db.commit()
        
        logger.debug(f"Location updated for trip {trip_id}: ({location_data.lat}, {location_data.lng})")
        
        return {
            "message": "Location updated successfully",
            "trip_id": str(trip_id),
            "timestamp": location.timestamp.isoformat()
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating location: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update location"
        )


@router.get("/{trip_id}/locations", response_model=List[trip_schemas.LocationResponse])
@rate_limit(max_requests=30, window_seconds=60, key_suffix="get_locations")
def get_trip_locations(
    request: Request,
    trip_id: UUID,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get location history for a trip (passenger or driver only)"""
    
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    # Check permission (passenger or driver)
    is_passenger = db.query(models.Booking).filter(
        models.Booking.trip_id == trip_id,
        models.Booking.passenger_id == current_user.id
    ).first() is not None
    
    is_driver = trip.driver_id == current_user.id
    
    if not is_passenger and not is_driver:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this trip's locations"
        )
    
    locations = db.query(models.TripLocation).filter(
        models.TripLocation.trip_id == trip_id
    ).order_by(models.TripLocation.timestamp.desc()).limit(100).all()
    
    return locations
