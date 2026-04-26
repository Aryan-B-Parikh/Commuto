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
import uuid
from typing import Optional
from services.wallet_service import payout_driver_from_prepaid_bookings, collect_ride_payments
from ride_states import RIDE_STATUS_ACCEPTED, RIDE_STATUS_CANCELLED, RIDE_STATUS_COMPLETED, RIDE_STATUS_STARTED, normalize_ride_status

router = APIRouter(prefix="/rides", tags=["OTP & Trip Completion"])
logger = logging.getLogger(__name__)


CASH_PAYMENT_STATUS = "cash"


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
        if normalize_ride_status(trip.status) == RIDE_STATUS_COMPLETED:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Trip is already completed"
            )
        
        if normalize_ride_status(trip.status) == RIDE_STATUS_CANCELLED:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Trip has been cancelled"
            )
        
        if trip.otp_verified:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP already verified"
            )

        # In post-ride model, we don't check for prepayment here, but check balance
        # if we want to be safe. For now, just allow starting.

        # Verify OTP (stored in trip while waiting for pickup).
        if trip.start_otp != otp_data.otp:
            db.rollback()
            logger.warning(f"Invalid OTP attempt for trip {trip_id} by driver {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP"
            )
        
        # Mark OTP as verified and start ride
        trip.otp_verified = True
        trip.status = RIDE_STATUS_STARTED
        trip.version += 1

        # Generate a fresh 6-digit completion OTP for drop-off verification.
        completion_otp = f"{uuid.uuid4().int % 1000000:06d}"
        trip.completion_otp = completion_otp
        trip.start_otp = None
        
        started_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"Trip {trip_id} started by driver {current_user.id}")
        
        return {
            "message": "Ride started successfully",
            "trip_id": str(trip.id),
            "started_at": started_at,
            "completion_otp": completion_otp,
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
    otp_data: Optional[trip_schemas.OTPVerify] = None,
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
        if normalize_ride_status(trip.status) == RIDE_STATUS_COMPLETED:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Trip is already completed"
            )
        
        if normalize_ride_status(trip.status) == RIDE_STATUS_CANCELLED:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Trip has been cancelled"
            )

        if otp_data is None:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Completion OTP is required to complete the ride"
            )

        if not trip.completion_otp:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Completion OTP is not available for this trip"
            )

        # Verify completion OTP from passenger before ending ride.
        if trip.completion_otp != otp_data.otp:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid completion OTP"
            )
        
        # Complete ride
        completed_at = datetime.utcnow()
        trip.status = RIDE_STATUS_COMPLETED
        trip.start_otp = None
        trip.completion_otp = None
        trip.version += 1
        
        # Update bookings
        bookings = db.query(models.Booking).filter(
            models.Booking.trip_id == trip_id
        ).all()

        # In post-ride model, payments are NOT 'completed' yet. We collect them now.
        
        for booking in bookings:
            booking.status = "completed"
        
        # Update driver trip count
        driver = db.query(models.Driver).filter(
            models.Driver.user_id == trip.driver_id
        ).with_for_update().first()
        
        if driver:
            driver.total_trips += 1
        
        # Post-ride payment collection
        collect_ride_payments(db, trip, bookings)
        trip.payment_status = CASH_PAYMENT_STATUS if (trip.payment_status or "").lower() == CASH_PAYMENT_STATUS else "completed"

        db.commit()
        
        logger.info(f"Trip {trip_id} completed by driver {current_user.id}")
        
        return {
            "message": "Ride completed successfully",
            "trip_id": str(trip.id),
            "completed_at": completed_at
        }
        
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error completing ride: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete ride"
        )
