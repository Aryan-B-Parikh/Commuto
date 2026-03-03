import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add the current directory to sys.path to import models and database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Error: DATABASE_URL not found in environment variables.")
    sys.exit(1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def clear_trips():
    db = SessionLocal()
    try:
        print("Cleaning up trip data...")
        
        # Order matters due to foreign key constraints
        tables = [
            "trip_locations",
            "live_locations",
            "trip_bids",
            "bookings",
            "trip_passengers",
            "trips"
        ]
        
        for table in tables:
            print(f"Clearing table: {table}")
            db.execute(text(f"DELETE FROM {table}"))
        
        db.commit()
        print("Successfully cleared all trip data!")
    except Exception as e:
        db.rollback()
        print(f"Error during cleanup: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    clear_trips()
