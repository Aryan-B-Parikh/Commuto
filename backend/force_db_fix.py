import sys
import os
from sqlalchemy import create_engine, text

# Database URL from .env
DATABASE_URL = "postgresql://postgres:Jaimin%40123@localhost:5432/Commuto"

def fix_schema():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        try:
            print("Checking/Adding columns to trip_bids...")
            conn.execute(text("ALTER TABLE trip_bids ADD COLUMN IF NOT EXISTS is_counter_bid BOOLEAN DEFAULT FALSE"))
            conn.execute(text("ALTER TABLE trip_bids ADD COLUMN IF NOT EXISTS parent_bid_id UUID"))
            conn.execute(text("COMMIT"))
            print("Schema updated successfully (if columns were missing).")
            
            # Also update existing counter bids that might have NULL for the flag but have a parent_id
            print("Updating existing counter bids...")
            conn.execute(text("UPDATE trip_bids SET is_counter_bid = TRUE WHERE parent_bid_id IS NOT NULL"))
            conn.execute(text("COMMIT"))
            print("Data normalization complete.")
            
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    fix_schema()
