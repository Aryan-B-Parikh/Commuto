from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from rate_limiter import rate_limit
import models
import schemas_trips as trip_schemas
import auth
import uuid
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import logging
from websocket_manager import manager
from fastapi import BackgroundTasks
import os
import hmac
import hashlib
import schemas

router = APIRouter(prefix="/rides", tags=["Rides"])
logger = logging.getLogger(__name__)


def populate_passenger_notes(trips, db):
    """Attach all passengers' notes (with names) to each trip."""
    trip_ids = [t.id for t in trips]
    if not trip_ids:
        return
    bookings_with_notes = db.query(
        models.Booking.trip_id,
        models.Booking.notes,
        models.User.full_name
    ).join(
        models.User, models.Booking.passenger_id == models.User.id
    ).filter(
        models.Booking.trip_id.in_(trip_ids),
        models.Booking.notes != None,
        models.Booking.notes != ""
    ).all()
    
    notes_map = {}
    for trip_id, note, name in bookings_with_notes:
        notes_map.setdefault(str(trip_id), []).append({
            "passenger_name": name,
            "notes": note
        })
    
    for trip in trips:
        trip.passenger_notes = notes_map.get(str(trip.id), [])

@router.get("/driver-earnings")
@rate_limit(max_requests=30, window_seconds=60, key_suffix="driver_earnings")
def get_driver_earnings(
    request: Request,
    current_user: models.User = Depends(auth.require_role(["driver"])),
    db: Session = Depends(get_db)
):
    """Get driver earnings breakdown from completed trips"""
    
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday())
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # All completed trips for this driver
    completed_trips = db.query(models.Trip).filter(
        models.Trip.driver_id == current_user.id,
        models.Trip.status.in_(["completed", "active", "bid_accepted", "driver_assigned"])
    ).order_by(models.Trip.created_at.desc()).all()
    
    # Calculate earnings
    def trip_earning(trip):
        if trip.price_per_seat and trip.total_seats:
            return float(trip.price_per_seat) * trip.total_seats
        return 0.0
    
    today_earning = sum(trip_earning(t) for t in completed_trips if t.created_at and t.created_at >= today_start)
    week_earning = sum(trip_earning(t) for t in completed_trips if t.created_at and t.created_at >= week_start)
    month_earning = sum(trip_earning(t) for t in completed_trips if t.created_at and t.created_at >= month_start)
    total_earning = sum(trip_earning(t) for t in completed_trips)
    total_trips = len(completed_trips)
    avg_per_trip = total_earning / total_trips if total_trips > 0 else 0.0
    
    # Recent trips (last 10)
    recent = []
    for trip in completed_trips[:10]:
        recent.append({
            "id": str(trip.id),
            "origin_address": trip.origin_address,
            "dest_address": trip.dest_address,
            "start_time": trip.start_time.isoformat() if trip.start_time else trip.created_at.isoformat(),
            "total_seats": trip.total_seats,
            "earning": trip_earning(trip),
            "status": trip.status,
        })
    
    return {
        "today": round(today_earning, 2),
        "this_week": round(week_earning, 2),
        "this_month": round(month_earning, 2),
        "total": round(total_earning, 2),
        "total_trips": total_trips,
        "avg_per_trip": round(avg_per_trip, 2),
        "recent_trips": recent,
    }

@router.post("/create-shared", response_model=trip_schemas.TripResponse, status_code=status.HTTP_201_CREATED)
@rate_limit(max_requests=5, window_seconds=60, key_suffix="create_shared_trip")
async def create_shared_ride(
    request: Request,
    trip_data: trip_schemas.SharedTripCreate,
    current_user: models.User = Depends(auth.require_role(["passenger"])),
    db: Session = Depends(get_db)
):
    """Create a public shared ride that others can join"""
    
    # Parse date and time
    try:
        dt_str = f"{trip_data.date} {trip_data.time}"
        for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d %I:%M %p"]:
            try:
                start_time = datetime.strptime(dt_str, fmt)
                break
            except ValueError:
                continue
        else:
            raise ValueError("Invalid format")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date/time format"
        )
    
    if start_time < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trip start time must be in the future"
        )
    
    new_trip = models.Trip(
        id=uuid.uuid4(),
        creator_passenger_id=current_user.id,
        origin_address=trip_data.from_location.address,
        origin_lat=trip_data.from_location.lat,
        origin_lng=trip_data.from_location.lng,
        dest_address=trip_data.to_location.address,
        dest_lat=trip_data.to_location.lat,
        dest_lng=trip_data.to_location.lng,
        start_time=start_time,
        total_seats=trip_data.total_seats,
        available_seats=trip_data.total_seats - 1, # Creator occupies 1 seat
        price_per_seat=trip_data.price_per_seat,
        notes=trip_data.notes.strip()[:500] if trip_data.notes else None,
        status="pending",
        version=0
    )
    
    # Creator is the first passenger
    booking = models.Booking(
        id=uuid.uuid4(),
        trip_id=new_trip.id,
        passenger_id=current_user.id,
        seats_booked=1,
        total_price=trip_data.price_per_seat,
        status="confirmed",
        payment_status="pending",
        notes=trip_data.notes.strip()[:500] if trip_data.notes else None
    )
    
    # Also add to TripPassenger table
    trip_passenger = models.TripPassenger(
        id=uuid.uuid4(),
        trip_id=new_trip.id,
        passenger_id=current_user.id,
        seats_booked=1
    )
    
    try:
        db.add(new_trip)
        db.add(booking)
        db.add(trip_passenger)
        db.commit()
        db.refresh(new_trip)
        
        # Broadcast to all drivers that a new ride is available
        await manager.send_to_drivers({
            "type": "new_ride_available",
            "trip": {
                "id": str(new_trip.id),
                "origin": new_trip.origin_address,
                "destination": new_trip.dest_address,
                "start_time": new_trip.start_time.isoformat(),
                "total_seats": new_trip.total_seats,
                "available_seats": new_trip.available_seats
            }
        })
        
        return new_trip
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating shared trip: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create shared trip")


@router.get("/available", response_model=List[trip_schemas.TripResponse])
def get_available_rides(
    request: Request,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all public shared rides that have available seats"""
    rides = db.query(models.Trip).filter(
        models.Trip.creator_passenger_id != None,
        models.Trip.status == "pending",
        models.Trip.available_seats > 0
    ).all()
    
    for ride in rides:
        ride.from_address = ride.origin_address
        ride.to_address = ride.dest_address
    return rides


@router.get("/{trip_id}/details", response_model=trip_schemas.TripWithPassengers)
def get_trip_details(
    trip_id: UUID,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed info about a trip including passengers and current user's booking"""
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # Sort out backwards compat fields
    trip.from_address = trip.origin_address
    trip.to_address = trip.dest_address
    
    # Populate creator manually if needed
    if trip.creator_passenger_id:
        creator_user = db.query(models.User).filter(models.User.id == trip.creator_passenger_id).first()
        trip.creator = creator_user

    # Find the current user's booking for this trip
    user_booking = db.query(models.Booking).filter(
        models.Booking.trip_id == trip_id,
        models.Booking.passenger_id == current_user.id
    ).first()
    
    trip.user_booking = user_booking

    # Populate per-passenger notes from bookings
    if hasattr(trip, 'passengers') and trip.passengers:
        bookings = db.query(models.Booking).filter(
            models.Booking.trip_id == trip_id
        ).all()
        booking_notes = {str(b.passenger_id): b.notes for b in bookings if b.notes}
        for p in trip.passengers:
            p.notes = booking_notes.get(str(p.id))

    return trip


class JoinRideBody(BaseModel):
    notes: Optional[str] = None

@router.post("/{trip_id}/join", status_code=status.HTTP_200_OK)
async def join_ride(
    trip_id: UUID,
    body: Optional[JoinRideBody] = None,
    current_user: models.User = Depends(auth.require_role(["passenger"])),
    db: Session = Depends(get_db)
):
    """Join a public shared ride"""
    try:
        db.begin_nested()
        trip = db.query(models.Trip).filter(models.Trip.id == trip_id).with_for_update().first()
        
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        if trip.available_seats <= 0:
            raise HTTPException(status_code=400, detail="Ride is full")
        
        # Check if already joined
        existing = db.query(models.TripPassenger).filter(
            models.TripPassenger.trip_id == trip_id,
            models.TripPassenger.passenger_id == current_user.id
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Already joined this ride")
        
        # Add passenger
        tp = models.TripPassenger(
            id=uuid.uuid4(),
            trip_id=trip_id,
            passenger_id=current_user.id,
            seats_booked=1
        )
        
        # Create booking record
        join_notes = body.notes.strip()[:500] if body and body.notes else None
        booking = models.Booking(
            id=uuid.uuid4(),
            trip_id=trip_id,
            passenger_id=current_user.id,
            seats_booked=1,
            total_price=trip.price_per_seat,
            status="confirmed",
            payment_status="pending",
            notes=join_notes
        )
        
        # Update trip
        trip.available_seats -= 1
        trip.version += 1
        
        db.add(tp)
        db.add(booking)
        db.commit()
        
        # Broadcast seat update to all in the trip
        await manager.broadcast_to_trip(str(trip_id), {
            "type": "seat_update",
            "trip_id": str(trip_id),
            "available_seats": trip.available_seats,
            "passenger": {
                "id": str(current_user.id),
                "full_name": current_user.full_name,
                "avatar_url": current_user.avatar_url
            }
        })
        
        return {"message": "Successfully joined ride", "available_seats": trip.available_seats}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error joining trip: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to join ride")


@router.post("/{trip_id}/leave", status_code=status.HTTP_200_OK)
async def leave_ride(
    trip_id: UUID,
    current_user: models.User = Depends(auth.require_role(["passenger"])),
    db: Session = Depends(get_db)
):
    """Leave a joined shared ride"""
    try:
        db.begin_nested()
        trip = db.query(models.Trip).filter(models.Trip.id == trip_id).with_for_update().first()
        
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
            
        # Creator cannot "leave" (they must cancel)
        if trip.creator_passenger_id == current_user.id:
            raise HTTPException(status_code=400, detail="Creator cannot leave. Use cancel instead.")
        
        # Check if joined
        tp = db.query(models.TripPassenger).filter(
            models.TripPassenger.trip_id == trip_id,
            models.TripPassenger.passenger_id == current_user.id
        ).first()
        
        if not tp:
            raise HTTPException(status_code=400, detail="Not a passenger in this ride")
        
        # Remove booking
        db.query(models.Booking).filter(
            models.Booking.trip_id == trip_id,
            models.Booking.passenger_id == current_user.id
        ).delete()
        
        # Remove TripPassenger
        db.delete(tp)
        
        # Update trip
        trip.available_seats += 1
        trip.version += 1
        
        db.commit()
        
        # Broadcast seat update
        await manager.broadcast_to_trip(str(trip_id), {
            "type": "seat_update",
            "trip_id": str(trip_id),
            "available_seats": trip.available_seats,
            "left_user_id": str(current_user.id)
        })
        
        return {"message": "Successfully left ride", "available_seats": trip.available_seats}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error leaving trip: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to leave ride")


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
    
    for trip in trips:
        # Get user's specific booking for this trip
        booking = db.query(models.Booking).filter(
            models.Booking.trip_id == trip.id,
            models.Booking.passenger_id == current_user.id
        ).first()
        
        if booking:
            trip.booking_total_price = float(booking.total_price)
            trip.booking_payment_status = booking.payment_status
            trip.seats_requested = booking.seats_booked
        else:
            trip.seats_requested = trip.total_seats
            
        trip.from_address = trip.origin_address
        trip.to_address = trip.dest_address
        
        # Populate driver details if driver is assigned
        if trip.driver and trip.driver.user:
            trip.driver_name = trip.driver.user.full_name
            trip.driver_avatar = trip.driver.user.avatar_url
            trip.driver_rating = float(trip.driver.rating) if trip.driver.rating else None
        
        # Count bids for this trip
        trip.bid_count = db.query(models.TripBid).filter(models.TripBid.trip_id == trip.id).count()
        
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
        trip.from_address = trip.origin_address
        trip.to_address = trip.dest_address
    
    populate_passenger_notes(trips, db)
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
    
    for ride in rides:
        ride.seats_requested = ride.total_seats
        ride.from_address = ride.origin_address
        ride.to_address = ride.dest_address
        
        # Populate driver details if driver is assigned
        if ride.driver and ride.driver.user:
            ride.driver_name = ride.driver.user.full_name
            ride.driver_avatar = ride.driver.user.avatar_url
            ride.driver_rating = float(ride.driver.rating) if ride.driver.rating else None
    
    populate_passenger_notes(rides, db)
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


@router.post("/{trip_id}/pay-order", response_model=schemas.TripPaymentOrderResponse)
@rate_limit(max_requests=10, window_seconds=60, key_suffix="trip_pay_order")
def create_trip_payment_order(
    request: Request,
    trip_id: UUID,
    booking_id: UUID,
    current_user: models.User = Depends(auth.require_role(["passenger"])),
    db: Session = Depends(get_db)
):
    """Create a Razorpay order for a specific trip booking"""
    import razorpay
    
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    
    if not key_id or not key_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment service not configured"
        )
    
    # Verify booking exists and belongs to user
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.trip_id == trip_id,
        models.Booking.passenger_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.payment_status == "completed":
        raise HTTPException(status_code=400, detail="Booking already paid")

    try:
        client = razorpay.Client(auth=(key_id, key_secret))
        
        amount_paise = int(booking.total_price * 100)
        
        order_data = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"t_{str(trip_id)[:20]}_{str(booking_id)[:10]}",
            "notes": {
                "trip_id": str(trip_id),
                "booking_id": str(booking_id),
                "passenger_id": str(current_user.id),
                "purpose": "trip_payment"
            }
        }
        
        order = client.order.create(data=order_data)
        
        # Store order ID in booking (if we had a field, otherwise we can just return it)
        # Assuming we might want to track this. For now just return it.
        
        return {
            "order_id": order["id"],
            "amount": amount_paise,
            "currency": "INR",
            "key": key_id,
            "trip_id": trip_id,
            "booking_id": booking_id
        }
        
    except Exception as e:
        logger.error(f"Error creating Razorpay trip order: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create payment order")


@router.post("/verify-trip-payment")
@rate_limit(max_requests=10, window_seconds=60, key_suffix="verify_trip_payment")
def verify_trip_payment(
    request: Request,
    payment_data: schemas.TripPaymentVerifyRequest,
    current_user: models.User = Depends(auth.require_role(["passenger"])),
    db: Session = Depends(get_db)
):
    """Verify Razorpay payment for a trip and credit the driver"""
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    
    if not key_secret:
        raise HTTPException(status_code=503, detail="Payment service not configured")
    
    try:
        # 1. Verify signature
        message = f"{payment_data.razorpay_order_id}|{payment_data.razorpay_payment_id}"
        expected_signature = hmac.new(
            key_secret.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if expected_signature != payment_data.razorpay_signature:
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        
        # 2. Get booking and trip
        booking = db.query(models.Booking).filter(
            models.Booking.id == payment_data.booking_id,
            models.Booking.passenger_id == current_user.id
        ).first()
        
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        trip = db.query(models.Trip).filter(models.Trip.id == booking.trip_id).first()
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")

        # 3. Update status
        booking.payment_status = "completed"
        
        # 4. Credit Driver Wallet
        if trip.driver_id:
            from routers.wallet_router import get_or_create_wallet
            from decimal import Decimal
            
            driver_wallet = get_or_create_wallet(trip.driver_id, db)
            amount = Decimal(str(booking.total_price))
            driver_wallet.balance += amount
            
            # Create earning transaction for driver
            transaction = models.Transaction(
                wallet_id=driver_wallet.id,
                amount=amount,
                type="credit",
                description=f"Earning from Trip: {trip.origin_address.split(',')[0]} to {trip.dest_address.split(',')[0]}",
                status="completed",
                razorpay_order_id=payment_data.razorpay_order_id,
                razorpay_payment_id=payment_data.razorpay_payment_id
            )
            db.add(transaction)
        
        db.commit()
        
        logger.info(f"Trip payment verified: {payment_data.booking_id}. Driver {trip.driver_id} credited.")
        
        return {"status": "success", "message": "Payment verified and driver credited"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error verifying trip payment: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to verify payment")
