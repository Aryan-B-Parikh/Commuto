"""
Read-only router exposing the Commuto geofence polygon.

The frontend fetches this at map init to render the shaded service-area overlay.
No authentication required — the polygon is public data.
"""

from fastapi import APIRouter, Request
from rate_limiter import rate_limit
from services.geofence import get_service_area_geojson

router = APIRouter(prefix="/geofence", tags=["Geofence"])


@router.get("/boundary")
@rate_limit(max_requests=60, window_seconds=60, key_suffix="geofence_boundary")
def get_boundary(request: Request):
    """Return the service-area polygon as a GeoJSON Feature."""
    return get_service_area_geojson()
