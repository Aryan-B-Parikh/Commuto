"""
Geofence service for Commuto — Charusat service area boundary.

Defines a convex polygon around Nadiad, Anand, Petlad, and Vadtal
(with ~500m buffer) and provides validation helpers used by ride
creation and future saved-places endpoints.

Algorithm: ray-casting point-in-polygon (O(n) per check, n = vertex count).
Zero external dependencies — pure Python + stdlib math.
"""

from typing import List, Tuple

# ---------------------------------------------------------------------------
# Service Area Polygon
# ---------------------------------------------------------------------------
# Vertices listed clockwise from the northernmost point.
# Each vertex already includes a ~500m outward buffer
# (~0.0045° lat, ~0.005° lng at this latitude).
#
# The polygon generously covers the urban spread (~3-4 km radius)
# of each town, not just their geographic centers.
#
# Town centers (for reference):
#   Nadiad  ≈ 22.6916°N, 72.8634°E
#   Anand   ≈ 22.5645°N, 72.9289°E
#   Petlad  ≈ 22.4727°N, 72.7992°E
#   Vadtal  ≈ 22.5545°N, 72.7508°E
#   Charusat ≈ 22.6005°N, 72.8194°E
# ---------------------------------------------------------------------------

CHARUSAT_SERVICE_POLYGON: List[Tuple[float, float]] = [
    (22.7450, 72.8100),   # North        — above Nadiad
    (22.7350, 72.9200),   # North-East   — NE of Nadiad
    (22.6100, 72.9750),   # East         — east of Anand
    (22.5100, 72.9700),   # South-East   — SE of Anand
    (22.4250, 72.8500),   # South        — below Petlad
    (22.4300, 72.7400),   # South-West   — SW of Petlad
    (22.5100, 72.6950),   # West         — west of Vadtal
    (22.6500, 72.7200),   # North-West   — between Vadtal & Nadiad
]

SERVICE_AREA_NAME = "Charusat region (Nadiad, Anand, Petlad, Vadtal)"


# ---------------------------------------------------------------------------
# Core algorithm
# ---------------------------------------------------------------------------

def _ray_cast_contains(polygon: List[Tuple[float, float]], lat: float, lng: float) -> bool:
    """Return True if (lat, lng) is inside *polygon* using the ray-casting algorithm.

    The polygon is a list of (lat, lng) tuples and is implicitly closed
    (the last vertex connects back to the first).
    """
    n = len(polygon)
    inside = False

    j = n - 1
    for i in range(n):
        yi, xi = polygon[i]
        yj, xj = polygon[j]

        # Check if the ray from (lat, lng) going rightward crosses edge i-j
        if ((yi > lat) != (yj > lat)) and (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi):
            inside = not inside

        j = i

    return inside


def is_inside_service_area(lat: float, lng: float) -> bool:
    """Check whether a single coordinate falls within the Charusat service area."""
    return _ray_cast_contains(CHARUSAT_SERVICE_POLYGON, lat, lng)


def validate_ride_coordinates(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> None:
    """Validate that both origin and destination are inside the service area.

    Raises ``ValueError`` with a user-friendly message when one or both
    coordinates fall outside the polygon.
    """
    origin_ok = is_inside_service_area(origin_lat, origin_lng)
    dest_ok = is_inside_service_area(dest_lat, dest_lng)

    if origin_ok and dest_ok:
        return

    if not origin_ok and not dest_ok:
        point_label = "Both your pickup and destination"
        verb = "are"
    elif not origin_ok:
        point_label = "Your pickup location"
        verb = "is"
    else:
        point_label = "Your destination"
        verb = "is"

    raise ValueError(
        f"{point_label} {verb} outside Commuto's service area. "
        f"Commuto currently operates only within the {SERVICE_AREA_NAME}."
    )


# ---------------------------------------------------------------------------
# GeoJSON export (consumed by GET /geofence/boundary and the frontend)
# ---------------------------------------------------------------------------

def get_service_area_geojson() -> dict:
    """Return the service polygon as a GeoJSON Feature (RFC 7946).

    Note: GeoJSON uses [longitude, latitude] ordering.
    """
    # Close the ring by repeating the first vertex at the end
    coords = [[lng, lat] for lat, lng in CHARUSAT_SERVICE_POLYGON]
    coords.append(coords[0])

    return {
        "type": "Feature",
        "properties": {
            "name": SERVICE_AREA_NAME,
            "description": "Commuto geofence — rides must start and end within this boundary.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [coords],
        },
    }
