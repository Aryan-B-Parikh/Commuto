import os
import sys
# Add current directory to path
sys.path.append(os.getcwd())

from database import SessionLocal
import models

def check_bookings():
    db = SessionLocal()
    try:
        bookings = db.query(models.Booking).all()
        for b in bookings:
            print(f"Booking ID: {b.id}, Trip ID: {b.trip_id}, Passenger ID: {b.passenger_id}, Status: {b.status}, Payment Status: {b.payment_status}")
    finally:
        db.close()

if __name__ == "__main__":
    check_bookings()
