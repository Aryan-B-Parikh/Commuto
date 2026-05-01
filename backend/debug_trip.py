from database import engine
from sqlalchemy import text
import json

def debug_data():
    trip_id = "1fa8de09-6075-4ef5-906b-92b8c0d6411b"
    with engine.connect() as conn:
        print("--- TRIP ---")
        trip = conn.execute(text(f"SELECT id, status, version, driver_id, total_price FROM trips WHERE id='{trip_id}'")).fetchone()
        print(f"Trip: {trip}")
        
        print("\n--- BIDS ---")
        bids = conn.execute(text(f"SELECT id, status, bid_amount, is_counter_bid, parent_bid_id, version FROM trip_bids WHERE trip_id='{trip_id}'")).fetchall()
        for b in bids:
            print(f"Bid: {b}")

if __name__ == "__main__":
    debug_data()
