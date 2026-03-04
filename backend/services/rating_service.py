"""
rating_service – driver rating calculation.

Extracted from rides_router.py so that the weighted rolling-average logic
can be unit-tested and updated without touching the HTTP layer.
"""
from __future__ import annotations

import logging
from decimal import Decimal

import models

logger = logging.getLogger(__name__)


def apply_driver_rating(driver: models.Driver, new_rating: float) -> float:
    """Apply a new passenger rating to a driver's cumulative score.

    Uses a true cumulative average keyed off ``driver.rating_count``
    (the number of individual ratings received, not trip count):

        new_avg = (old_avg * n + new_rating) / (n + 1)

    This correctly handles multiple ratings per trip (e.g. from different
    passengers in a shared ride) and avoids the data-loss bug that would
    occur when using ``total_trips`` as the weight.

    Increments ``driver.rating_count`` and mutates ``driver.rating`` in
    place.  Returns the updated float value.  The caller is responsible for
    committing the session.
    """
    rating = Decimal(str(new_rating))
    n = driver.rating_count or 0  # number of ratings *already* stored
    if driver.rating is None or n == 0:
        driver.rating = rating
        driver.rating_count = 1
    else:
        driver.rating = (driver.rating * n + rating) / (n + 1)
        driver.rating_count = n + 1

    updated = float(driver.rating)
    logger.debug("Driver %s rating updated to %.2f (n=%d)", driver.user_id, updated, driver.rating_count)
    return updated
