from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
from rate_limiter import rate_limit
import models
import schemas_trips as trip_schemas
import auth
from uuid import UUID
from datetime import datetime
import logging

router = APIRouter(prefix="/rides", tags=["OTP & Trip Completion"])
logger = logging.getLogger(__name__)


@router.post("/{trip_id}/verify-otp", response_model=trip_schemas.OTPVerifyResponse, status_code=status.HTTP_200_OK)
@rate_limit(max_requests=5, window_seconds=60, key_suffix="verify_otp")
def verify_otp_and_start_ride(
    request: Request,
    trip_id: UUID,
    otp_data: trip_schemas.OTPVerify,
    current_user: models.User = Depends(auth.require_role(["driver"])),
    db: Session = Depends(get_db)
):
    """Verify OTP and start ride with rate limiting (5 attempts per minute)"""
    
    try:
        db.begin_nested()
        
        # Get trip with lock
        trip = db.query(models.Trip).filter(
            models.Trip.id == trip_id
        ).with_for_update().first()
        
        if not trip:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )
        
        # Only assigned driver can verify
        if trip.driver_id != current_user.id:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to this trip"
            )
        
        # Check trip status
        if trip.status == "completed":
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Trip is already completed"
            )
        
        if trip.status == "cancelled":
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Trip has been cancelled"
            )
        
        # Verify OTP (now stored directly in trip)
        if trip.start_otp != otp_data.otp:
            db.rollback()
            logger.warning(f"Invalid OTP attempt for trip {trip_id} by driver {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP"
            )
        
        if trip.otp_verified:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP already verified"
            )
        
        # Mark OTP as verified and start ride
        trip.otp_verified = True
        trip.status = "active"
        trip.version += 1
        
        started_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"Trip {trip_id} started by driver {current_user.id}")
        
        return {
            "message": "Ride started successfully",
            "trip_id": str(trip.id),
            "started_at": started_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error verifying OTP: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify OTP"
        )


@router.post("/{trip_id}/complete", response_model=trip_schemas.TripCompleteResponse, status_code=status.HTTP_200_OK)
@rate_limit(max_requests=5, window_seconds=60, key_suffix="complete_trip")
def complete_ride(
    request: Request,
    trip_id: UUID,
    current_user: models.User = Depends(auth.require_role(["driver"])),
    db: Session = Depends(get_db)
):
    """Complete a ride with transaction safety"""
    
    try:
        db.begin_nested()
        
        # Get trip with lock
        trip = db.query(models.Trip).filter(
            models.Trip.id == trip_id
        ).with_for_update().first()
        
        if not trip:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )
        
        # Only assigned driver can complete
        if trip.driver_id != current_user.id:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to this trip"
            )
        
        # Check if OTP was verified
        if not trip.otp_verified:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ride has not been started with OTP verification"
            )
        
        # Check if already completed
        if trip.status == "completed":
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Trip is already completed"
            )
        
        if trip.status == "cancelled":
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Trip has been cancelled"
            )
        
        # Complete ride
        completed_at = datetime.utcnow()
        trip.status = "completed"
        trip.version += 1
        
        # Update bookings
        bookings = db.query(models.Booking).filter(
            models.Booking.trip_id == trip_id
        ).all()
        
        for booking in bookings:
            booking.status = "completed"
            booking.payment_status = "completed"
        
        # Update driver trip count
        driver = db.query(models.Driver).filter(
            models.Driver.user_id == trip.driver_id
        ).with_for_update().first()
        
        if driver:
            driver.total_trips += 1
        
        db.commit()
        
        logger.info(f"Trip {trip_id} completed by driver {current_user.id}")
        
        return {
            "message": "Ride completed successfully",
            "trip_id": str(trip.id),
            "completed_at": completed_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error completing ride: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete ride"
        )
