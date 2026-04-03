import sqlalchemy
from sqlalchemy import create_engine, text
import os

DATABASE_URL = "postgresql://postgres:Jaimin%40123@localhost:5432/Commuto"

def fix():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Dropping constraints...")
        conn.execute(text("ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check"))
        conn.execute(text("ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_payment_status_check"))
        
        print("Adding broad constraints...")
        conn.execute(text("ALTER TABLE trips ADD CONSTRAINT trips_status_check CHECK (status IN ('pending', 'available', 'upcoming', 'active', 'completed', 'cancelled'))"))
        conn.execute(text("ALTER TABLE trips ADD CONSTRAINT trips_payment_status_check CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'))"))
        
        conn.commit()
        print("DONE.")

if __name__ == "__main__":
    try:
        fix()
    except Exception as e:
        print(f"ERROR: {e}")
