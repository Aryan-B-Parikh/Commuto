from database import engine, Base
import models
from sqlalchemy import text

def reset_database():
    print("⚠ WARNING: This will drop all tables in the database!")
    print("Resetting database schema...")
    
    # Force drop legacy tables and existing tables with CASCADE
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS ride_bids CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS ride_requests CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS bills CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS trip_bids CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS bookings CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS trip_locations CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS trips CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS vehicles CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS drivers CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS passengers CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS saved_places CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
        conn.commit()
    
    print("Dropped all tables manually.")
    
    # Create all tables from models
    print("Creating all tables from models...")
    Base.metadata.create_all(bind=engine)
    
    print("✅ Database reset complete. Schema is now synced with models.")

if __name__ == "__main__":
    try:
        reset_database()
    except Exception as e:
        print(f"❌ Error resetting database: {e}")
