"""Quick smoke test for the geofence module."""
import sys
sys.path.insert(0, ".")

from services.geofence import (
    is_inside_service_area,
    validate_ride_coordinates,
    get_service_area_geojson,
)

# Points that MUST be inside the polygon
inside_points = {
    "Charusat campus": (22.6005, 72.8194),
    "Nadiad center":   (22.6916, 72.8634),
    "Anand center":    (22.5645, 72.9289),
    "Petlad center":   (22.4727, 72.7992),
    "Vadtal center":   (22.5545, 72.7508),
}

# Points that MUST be outside
outside_points = {
    "Ahmedabad":   (23.0225, 72.5714),
    "Mumbai":      (19.0760, 72.8777),
    "Vadodara":    (22.3072, 73.1812),
}

print("=== Point-in-Polygon Tests ===")
all_pass = True

for name, (lat, lng) in inside_points.items():
    result = is_inside_service_area(lat, lng)
    status = "PASS" if result else "FAIL"
    if not result:
        all_pass = False
    print(f"  {status}: {name} ({lat}, {lng}) -> inside={result}")

for name, (lat, lng) in outside_points.items():
    result = is_inside_service_area(lat, lng)
    status = "PASS" if not result else "FAIL"
    if result:
        all_pass = False
    print(f"  {status}: {name} ({lat}, {lng}) -> inside={result}")

print()
print("=== Ride Validation Tests ===")

# Should pass (both inside)
try:
    validate_ride_coordinates(22.6005, 72.8194, 22.6916, 72.8634)
    print("  PASS: Charusat -> Nadiad accepted")
except ValueError as e:
    print(f"  FAIL: Charusat -> Nadiad rejected: {e}")
    all_pass = False

# Should fail (origin outside)
try:
    validate_ride_coordinates(23.0225, 72.5714, 22.6005, 72.8194)
    print("  FAIL: Ahmedabad -> Charusat was accepted (should reject)")
    all_pass = False
except ValueError as e:
    print(f"  PASS: Ahmedabad -> Charusat rejected: {e}")

# Should fail (both outside)
try:
    validate_ride_coordinates(23.0225, 72.5714, 19.0760, 72.8777)
    print("  FAIL: Ahmedabad -> Mumbai was accepted (should reject)")
    all_pass = False
except ValueError as e:
    print(f"  PASS: Ahmedabad -> Mumbai rejected: {e}")

print()
print("=== GeoJSON Export ===")
geojson = get_service_area_geojson()
print(f"  Type: {geojson['type']}")
print(f"  Geometry: {geojson['geometry']['type']}")
print(f"  Vertices (incl. closing): {len(geojson['geometry']['coordinates'][0])}")
print(f"  Properties: {geojson['properties']}")

print()
print(f"{'ALL TESTS PASSED' if all_pass else 'SOME TESTS FAILED'}")
