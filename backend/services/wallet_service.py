"""Wallet helpers for ride prepayment and settlement."""
from __future__ import annotations

import uuid
import logging
from typing import Sequence
from decimal import Decimal

from sqlalchemy.orm import Session

import models

logger = logging.getLogger(__name__)


CASH_PAYMENT_STATUS = "cash"


def _to_decimal(value: object) -> Decimal:
    if value is None:
        return Decimal("0")
    return Decimal(str(value))


def get_or_create_wallet_for_update(db: Session, user_id) -> models.Wallet:
    """Fetch a wallet row with FOR UPDATE lock, creating it if absent."""
    wallet = db.query(models.Wallet).filter(
        models.Wallet.user_id == user_id
    ).with_for_update().first()

    if wallet:
        return wallet

    wallet = models.Wallet(
        id=uuid.uuid4(),
        user_id=user_id,
        balance=Decimal("0"),
    )
    db.add(wallet)
    db.flush()
    return wallet


def hold_wallet_funds_or_raise(
    db: Session,
    user_id,
    amount,
    description: str,
    *,
    transaction_type: str = "payment",
) -> Decimal:
    """Deduct funds immediately from a user's wallet.

    Raises:
        ValueError: if amount is invalid or wallet balance is insufficient.
    """
    debit_amount = _to_decimal(amount)
    if debit_amount <= Decimal("0"):
        raise ValueError("Amount must be greater than zero")

    wallet = get_or_create_wallet_for_update(db, user_id)
    current_balance = _to_decimal(wallet.balance)

    if current_balance < debit_amount:
        raise ValueError("Insufficient wallet balance")

    wallet.balance = current_balance - debit_amount
    db.add(models.Transaction(
        id=uuid.uuid4(),
        wallet_id=wallet.id,
        amount=-debit_amount,
        type=transaction_type,
        description=description,
        status="completed",
    ))
    return debit_amount


def release_wallet_funds(
    db: Session,
    user_id,
    amount,
    description: str,
    *,
    transaction_type: str = "refund",
) -> Decimal:
    """Credit funds back to a user's wallet."""
    credit_amount = _to_decimal(amount)
    if credit_amount <= Decimal("0"):
        return Decimal("0")

    wallet = get_or_create_wallet_for_update(db, user_id)
    wallet.balance = _to_decimal(wallet.balance) + credit_amount
    db.add(models.Transaction(
        id=uuid.uuid4(),
        wallet_id=wallet.id,
        amount=credit_amount,
        type=transaction_type,
        description=description,
        status="completed",
    ))
    return credit_amount


def reconcile_booking_hold(
    db: Session,
    booking: models.Booking,
    new_total,
    description_prefix: str,
    *,
    blocking: bool = True
) -> None:
    """Update the booking fare without performing immediate wallet transactions.
    
    Since we shifted to post-ride deduction, this function only updates the 
    database record so the final charge at the end of the trip is correct.
    """
    updated_total = _to_decimal(new_total)
    booking.total_price = updated_total
    # Payment status remains 'pending' or 'completed' depending on context,
    # but for post-ride payments, we keep it as 'pending' until the ride ends.
    booking.payment_status = "pending"


def collect_ride_payments(
    db: Session,
    trip: models.Trip,
    bookings: Sequence[models.Booking],
) -> Decimal:
    """Collect final fares from all passengers and payout the driver at trip completion.
    
    This is called at the end of the ride (OTP completion).
    """
    if not trip.driver_id:
        return Decimal("0")

    total_collected = Decimal("0")
    
    for booking in bookings:
        if booking.status == "cancelled":
            continue
        if (booking.payment_status or "").lower() == CASH_PAYMENT_STATUS:
            continue
            
        fare = _to_decimal(booking.total_price)
        if fare <= 0:
            continue
            
        try:
            # Deduct from passenger
            hold_wallet_funds_or_raise(
                db,
                booking.passenger_id,
                fare,
                f"Ride payment - {trip.dest_address.split(',')[0]}",
                transaction_type="payment"
            )
            booking.payment_status = "completed"
            total_collected += fare
        except ValueError as e:
            logger.error(f"Failed to collect payment from passenger {booking.passenger_id}: {str(e)}")
            # In a production system, we might mark the booking as 'debt' or 'unpaid'
            booking.payment_status = "failed"

    if total_collected <= 0:
        return Decimal("0")

    # Credit the driver
    driver_wallet = get_or_create_wallet_for_update(db, trip.driver_id)
    driver_wallet.balance = _to_decimal(driver_wallet.balance) + total_collected

    db.add(models.Transaction(
        id=uuid.uuid4(),
        wallet_id=driver_wallet.id,
        amount=total_collected,
        type="credit",
        description=f"Ride earnings (Post-ride) - {trip.dest_address.split(',')[0]}",
        status="completed",
    ))
    
    return total_collected


def payout_driver_from_prepaid_bookings(
    db: Session,
    trip: models.Trip,
    bookings: Sequence[models.Booking],
) -> Decimal:
    """Transfer collected prepaid booking amounts to the assigned driver."""
    if not trip.driver_id:
        return Decimal("0")

    payable = Decimal("0")
    for booking in bookings:
        if booking.status == "cancelled":
            continue
        if booking.payment_status != "completed":
            continue
        amount = _to_decimal(booking.total_price)
        if amount > Decimal("0"):
            payable += amount

    if payable <= Decimal("0"):
        return Decimal("0")

    # CAP: Ensure driver doesn't get more than the trip total price
    # to avoid rounding artifacts (e.g. 33.34 * 3 = 100.02)
    max_payable = _to_decimal(trip.total_price)
    if payable > max_payable:
        logger.info(f"Capping driver payout from {payable} to {max_payable} (trip total)")
        payable = max_payable

    driver_wallet = get_or_create_wallet_for_update(db, trip.driver_id)
    driver_wallet.balance = _to_decimal(driver_wallet.balance) + payable

    destination = (trip.dest_address or "Trip").split(",")[0]
    db.add(models.Transaction(
        id=uuid.uuid4(),
        wallet_id=driver_wallet.id,
        amount=payable,
        type="credit",
        description=f"Ride earnings - {destination}",
        status="completed",
    ))
    return payable


def process_ride_payments(
    db: Session,
    trip: models.Trip,
    bookings: Sequence[models.Booking],
) -> None:
    """Backwards-compatible entrypoint for ride settlement.

    New behavior assumes bookings are prepaid and only releases payout
    to the driver when ride completion is successful.
    """
    unpaid = [b for b in bookings if b.status != "cancelled" and b.payment_status != "completed"]
    if unpaid:
        raise ValueError("Cannot settle ride with unpaid bookings")
    payout_driver_from_prepaid_bookings(db, trip, bookings)
