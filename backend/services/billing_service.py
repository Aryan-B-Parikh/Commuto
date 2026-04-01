"""
billing_service – trip receipt generation.

Extracted from rides_router.py so that receipt aggregation logic can be
unit-tested independently of the FastAPI request context.

Note on ``total_price`` and prepayment
-------------------------------------
``total_price`` is the amount held from the passenger wallet when a booking
is created/joined (and adjusted if accepted bid price changes). Driver payout
is released only when ride completion succeeds.
"""
from __future__ import annotations

import logging
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from fastapi import HTTPException

import models

logger = logging.getLogger(__name__)


def get_trip_receipt(
    db: Session,
    trip_id: UUID,
    current_user: models.User,
) -> dict:
    """Build and return a receipt dict for a completed (or in-progress) trip.

    Raises HTTPException(404) if the trip is not found, and
    HTTPException(403) if the requesting user is neither a passenger nor the
    driver of the trip.
    """
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Authorisation: requester must be a passenger or the driver
    booking: models.Booking | None = (
        db.query(models.Booking)
        .filter(
            models.Booking.trip_id == trip_id,
            models.Booking.passenger_id == current_user.id,
        )
        .first()
    )
    is_driver = trip.driver_id == current_user.id

    if not booking and not is_driver:
        raise HTTPException(status_code=403, detail="Access denied")

    # Driver & vehicle info
    driver_name: str | None = None
    driver_rating: float | None = None
    vehicle_info: str | None = None

    if trip.driver_id:
        driver_user = (
            db.query(models.User)
            .filter(models.User.id == trip.driver_id)
            .first()
        )
        driver_profile = (
            db.query(models.Driver)
            .filter(models.Driver.user_id == trip.driver_id)
            .first()
        )
        if driver_user:
            driver_name = driver_user.full_name
        if driver_profile:
            driver_rating = float(driver_profile.rating) if driver_profile.rating else None
            if driver_profile.vehicles:
                v = driver_profile.vehicles[0]
                vehicle_info = f"{v.make} {v.model} – {v.plate_number}"

    # Total price calculation
    # For a driver receipt: sum all non-cancelled bookings (earnings view).
    # For a passenger receipt: use booking.total_price (what was billed).
    # The field is intentionally named ``total_price`` (not ``total_paid``)
    # because it represents the booking charge amount, not a payout event.
    if is_driver and not booking:
        total_price = float(
            db.query(sql_func.sum(models.Booking.total_price))
            .filter(
                models.Booking.trip_id == trip_id,
                models.Booking.status != "cancelled",
            )
            .scalar()
            or 0
        )
        payment_status = trip.payment_status
    else:
        total_price = float(booking.total_price) if booking else 0.0
        payment_status = booking.payment_status if booking else trip.payment_status

    return {
        "trip_id": str(trip.id),
        "status": trip.status,
        "origin": trip.origin_address,
        "destination": trip.dest_address,
        "scheduled_at": trip.start_time.isoformat() if trip.start_time else None,
        "completed_at": trip.updated_at.isoformat() if trip.status == "completed" else None,
        "driver_name": driver_name,
        "driver_rating": driver_rating,
        "vehicle": vehicle_info,
        "seats": booking.seats_booked if booking else trip.total_seats,
        "price_per_seat": float(trip.price_per_seat) if trip.price_per_seat else 0,
        "total_price": total_price,
        "payment_status": payment_status,
        "otp_verified": trip.otp_verified,
    }
