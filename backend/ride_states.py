from typing import Optional

RIDE_STATUS_REQUESTED = "requested"
RIDE_STATUS_ACCEPTED = "accepted"
RIDE_STATUS_STARTED = "started"
RIDE_STATUS_COMPLETED = "completed"
RIDE_STATUS_CANCELLED = "cancelled"

RIDE_STATUS_ALIASES = {
    "requested": RIDE_STATUS_REQUESTED,
    "pending": RIDE_STATUS_REQUESTED,
    "upcoming": RIDE_STATUS_REQUESTED,
    "accepted": RIDE_STATUS_ACCEPTED,
    "bid_accepted": RIDE_STATUS_ACCEPTED,
    "driver_assigned": RIDE_STATUS_ACCEPTED,
    "started": RIDE_STATUS_STARTED,
    "active": RIDE_STATUS_STARTED,
    "completed": RIDE_STATUS_COMPLETED,
    "cancelled": RIDE_STATUS_CANCELLED,
}


def normalize_ride_status(status: Optional[str]) -> str:
    if not status:
        return RIDE_STATUS_REQUESTED
    return RIDE_STATUS_ALIASES.get(status.lower(), RIDE_STATUS_REQUESTED)


def is_ride_started(status: Optional[str]) -> bool:
    return normalize_ride_status(status) == RIDE_STATUS_STARTED


def is_ride_finished(status: Optional[str]) -> bool:
    normalized = normalize_ride_status(status)
    return normalized in {RIDE_STATUS_COMPLETED, RIDE_STATUS_CANCELLED}