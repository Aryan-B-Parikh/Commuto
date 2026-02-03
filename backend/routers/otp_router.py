from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas_trips as trip_schemas
import auth

router = APIRouter(prefix="/rides", tags=["OTP"])

@router.post("/{trip_id}/verify-otp", status_code=status.HTTP_200_OK)
def verify_otp_and_start_ride(
    trip_id: str,
    otp_data: trip_schemas.OTPVerify,
    current_user: models.User = Depends(auth.require_role(["driver"])),
    db: Session = Depends(get_db)
):
    # Get trip
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    # Only assigned driver can verify
    if trip.driver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to this trip"
        )
    
    # Get active ride
    active_ride = db.query(models.ActiveRide).filter(
        models.ActiveRide.trip_id == trip_id
    ).first()
    
    if not active_ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active ride not found"
        )
    
    # Verify OTP
    if active_ride.otp != otp_data.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP"
        )
    
    # Mark OTP as verified and start ride
    from datetime import datetime
    active_ride.otp_verified = True
    active_ride.started_at = datetime.utcnow()
    trip.status = models.TripStatus.ACTIVE
    
    db.commit()
    
    return {
        "message": "Ride started successfully",
        "trip_id": trip.id,
        "started_at": active_ride.started_at
    }

@router.post("/{trip_id}/complete", status_code=status.HTTP_200_OK)
def complete_ride(
    trip_id: str,
    current_user: models.User = Depends(auth.require_role(["driver"])),
    db: Session = Depends(get_db)
):
    # Get trip
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    # Only assigned driver can complete
    if trip.driver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to this trip"
        )
    
    # Get active ride
    active_ride = db.query(models.ActiveRide).filter(
        models.ActiveRide.trip_id == trip_id
    ).first()
    
    if not active_ride or not active_ride.otp_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ride has not been started with OTP verification"
        )
    
    # Complete ride
    from datetime import datetime
    active_ride.completed_at = datetime.utcnow()
    trip.status = models.TripStatus.COMPLETED
    
    # Update user trip counts
    passenger = db.query(models.User).filter(models.User.id == trip.passenger_id).first()
    driver = db.query(models.User).filter(models.User.id == trip.driver_id).first()
    
    if passenger:
        passenger.total_trips += 1
    if driver:
        driver.total_trips += 1
    
    db.commit()
    
    return {
        "message": "Ride completed successfully",
        "trip_id": trip.id,
        "completed_at": active_ride.completed_at
    }
