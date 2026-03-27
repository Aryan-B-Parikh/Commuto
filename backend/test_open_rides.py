import sys
import os
import json
sys.path.append('d:/Commuto/backend')
from database import SessionLocal
import models
from sqlalchemy import text

db = SessionLocal()
trips = db.query(models.Trip).filter(models.Trip.status == "pending").all()
output = {"pending_trips": []}

for t in trips:
    c = db.query(models.User).filter(models.User.id == t.creator_passenger_id).first()
    output["pending_trips"].append({
        "trip_id": str(t.id),
        "creator": c.email if c else "None"
    })

output["drivers"] = []
drivers = db.query(models.User).filter(models.User.role == "driver").all()
for d in drivers:
    is_passenger_cond = db.query(models.Booking).filter(
        models.Booking.trip_id == models.Trip.id,
        models.Booking.passenger_id == d.id
    ).exists()
    
    has_bidded_cond = db.query(models.TripBid).filter(
        models.TripBid.trip_id == models.Trip.id,
        models.TripBid.driver_id == d.id
    ).exists()
    
    rides = db.query(models.Trip).filter(
        models.Trip.status == "pending",
        ~is_passenger_cond,
        ~has_bidded_cond
    ).all()
    
    output["drivers"].append({
        "driver": d.email,
        "sees_open_rides_count": len(rides)
    })

print(json.dumps(output, indent=2))
db.close()
