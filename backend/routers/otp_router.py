from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas_trips as trip_schemas
import auth
from uuid import UUID
from datetime import datetime

router = APIRouter(prefix="/rides", tags=["OTP"])

@router.post("/{trip_id}/verify-otp", status_code=status.HTTP_200_OK)
def verify_otp_and_start_ride(
    trip_id: UUID,
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
    
    # Verify OTP (now stored directly in trip)
    if trip.start_otp != otp_data.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP"
        )
    
    if trip.otp_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP already verified"
        )
    
    # Mark OTP as verified and start ride
    trip.otp_verified = True
    trip.status = "active"
    
    db.commit()
    
    return {
        "message": "Ride started successfully",
        "trip_id": str(trip.id),
        "started_at": datetime.utcnow()
    }

@router.post("/{trip_id}/complete", status_code=status.HTTP_200_OK)
def complete_ride(
    trip_id: UUID,
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
    
    # Check if OTP was verified
    if not trip.otp_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ride has not been started with OTP verification"
        )
    
    # Complete ride
    completed_at = datetime.utcnow()
    trip.status = "completed"
    
    # Update bookings
    bookings = db.query(models.Booking).filter(
        models.Booking.trip_id == trip_id
    ).all()
    
    for booking in bookings:
        booking.status = "completed"
        booking.payment_status = "completed"
    
    # Update driver trip count
    driver = db.query(models.Driver).filter(models.Driver.user_id == trip.driver_id).first()
    if driver:
        driver.total_trips += 1
    
    db.commit()
    
    return {
        "message": "Ride completed successfully",
        "trip_id": str(trip.id),
        "completed_at": completed_at
    }
