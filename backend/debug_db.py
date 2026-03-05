
from database import SessionLocal
import models
from uuid import UUID

def debug_profiles():
    db = SessionLocal()
    try:
        print("--- Driver Role vs Profile Check ---")
        users = db.query(models.User).filter(models.User.role == "driver").all()
        for u in users:
            driver = db.query(models.Driver).filter(models.Driver.user_id == u.id).first()
            if not driver:
                print(f"MISSING PROFILE: User {u.email} (ID: {u.id}) is a driver but has NO driver profile!")
            else:
                print(f"OK: User {u.email} (ID: {u.id}) has a driver profile.")
        
        print("\n--- Trips and Bids Check ---")
        trips = db.query(models.Trip).all()
        for t in trips:
            print(f"Trip {t.id} - Status: {t.status}")
            bids = db.query(models.TripBid).filter(models.TripBid.trip_id == t.id).all()
            for b in bids:
                print(f"  Bid {b.id} by {b.driver_id} - Status: {b.status}, Amount: {b.bid_amount}")
                
    finally:
        db.close()

if __name__ == "__main__":
    debug_profiles()
