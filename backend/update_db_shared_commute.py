import sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from database import engine
from sqlalchemy import text
import uuid

def update_schema():
    conn = engine.connect()
    print("Connecting to database...")
    
    try:
        # 1. Add creator_passenger_id to trips table
        print("Adding creator_passenger_id to trips table...")
        conn.execute(text("ALTER TABLE trips ADD COLUMN IF NOT EXISTS creator_passenger_id UUID REFERENCES users(id)"))
        
        # 2. Add available_seats to trips table (if missing, though I think I saw it in schemas)
        print("Adding available_seats to trips table...")
        conn.execute(text("ALTER TABLE trips ADD COLUMN IF NOT EXISTS available_seats INTEGER DEFAULT 0"))
        
        # 3. Create trip_passengers table
        print("Creating trip_passengers table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS trip_passengers (
                id UUID PRIMARY KEY,
                trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
                passenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                seats_booked INTEGER DEFAULT 1
            )
        """))
        
        conn.commit()
        print("Successfully updated database schema.")
    except Exception as e:
        print(f"Error updating schema: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    update_schema()
