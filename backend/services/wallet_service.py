"""
wallet_service – ride payment processing and ledger management.

Extracted from otp_router.py so that the business rules around wallet
deduction and debt tracking can be tested and changed independently of
the HTTP layer.
"""
from __future__ import annotations

import uuid
import logging
from typing import Sequence
from decimal import Decimal

from sqlalchemy.orm import Session

import models

logger = logging.getLogger(__name__)


def process_ride_payments(
    db: Session,
    trip: models.Trip,
    bookings: Sequence[models.Booking],
) -> None:
    """Deduct booking amounts from each passenger's wallet atomically.

    Rules:
    * All relevant wallets are locked in a single IN-clause query to minimise
      round-trips and keep the holding lock time as short as possible.
    * The recorded ``payment`` transaction always matches the *actual* cash
      movement (capped at the available balance) so completed-transaction
      sums equal the real balance change.
    * When a passenger's balance is insufficient a separate ``debt``
      transaction is created with a *positive* amount representing money
      owed *to* the system.  Because it is ``pending`` and does not reduce
      the wallet balance it does not violate the ledger invariant.
    * Missing wallets are auto-created with a zero balance.

    This function must be called within an active database transaction; the
    caller is responsible for committing or rolling back.
    """
    billable = [b for b in bookings if b.total_price and b.total_price > 0]
    if not billable:
        return

    passenger_ids = [b.passenger_id for b in billable]
    dest = trip.dest_address.split(",")[0]
    total_collected = Decimal("0")

    # Lock all wallets in one round-trip
    existing_wallets: dict = {
        w.user_id: w
        for w in db.query(models.Wallet)
        .filter(models.Wallet.user_id.in_(passenger_ids))
        .with_for_update()
        .all()
    }

    for booking in billable:
        wallet = existing_wallets.get(booking.passenger_id)
        if not wallet:
            wallet = models.Wallet(
                id=uuid.uuid4(),
                user_id=booking.passenger_id,
                balance=0,
            )
            db.add(wallet)
            db.flush()
            existing_wallets[booking.passenger_id] = wallet

        deduction = Decimal(str(booking.total_price))
        current_balance = Decimal(str(wallet.balance))
        actual_deduction = min(deduction, current_balance)
        owed = deduction - actual_deduction
        total_collected += actual_deduction

        wallet.balance = current_balance - actual_deduction

        db.add(models.Transaction(
            id=uuid.uuid4(),
            wallet_id=wallet.id,
            amount=-actual_deduction,
            type="payment",
            description=f"Ride payment – {dest}",
            status="completed",
        ))

        if owed > Decimal("0"):
            logger.warning(
                "Passenger %s has insufficient balance for trip %s; "
                "%.2f recorded as outstanding debt.",
                booking.passenger_id,
                trip.id,
                owed,
            )
            db.add(models.Transaction(
                id=uuid.uuid4(),
                wallet_id=wallet.id,
                amount=owed,   # positive: money *owed to* the system, no balance impact
                type="debt",
                description=f"Outstanding ride debt – {dest}",
                status="pending",
            ))

    # Credit the assigned driver with the amount actually collected from passengers.
    if trip.driver_id and total_collected > Decimal("0"):
        driver_wallet = db.query(models.Wallet).filter(
            models.Wallet.user_id == trip.driver_id
        ).with_for_update().first()

        if not driver_wallet:
            driver_wallet = models.Wallet(
                id=uuid.uuid4(),
                user_id=trip.driver_id,
                balance=0,
            )
            db.add(driver_wallet)
            db.flush()

        driver_wallet.balance = Decimal(str(driver_wallet.balance)) + total_collected
        db.add(models.Transaction(
            id=uuid.uuid4(),
            wallet_id=driver_wallet.id,
            amount=total_collected,
            type="credit",
            description=f"Ride earnings – {dest}",
            status="completed",
        ))
