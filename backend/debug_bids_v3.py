import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database URL from .env
DATABASE_URL = "postgresql://postgres:Jaimin%40123@localhost:5432/Commuto"

def check_bids():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    try:
        # Use raw SQL to be absolutely sure what's in the DB
        result = db.execute(text("SELECT id, bid_amount, status, is_counter_bid, parent_bid_id FROM trip_bids"))
        rows = result.fetchall()
        
        output_path = os.path.join(os.getcwd(), "db_bids_output_v3.txt")
        with open(output_path, "w") as f:
            f.write("Trip Bids in Database:\n")
            if not rows:
                f.write("No bids found.\n")
            for row in rows:
                f.write(f"ID: {row[0]}, Amount: {row[1]}, Status: {row[2]}, IsCounter: {row[3]}, Parent: {row[4]}\n")
        print(f"Success! Output written to {output_path}")
    except Exception as e:
        output_path = os.path.join(os.getcwd(), "db_bids_output_v3.txt")
        with open(output_path, "w") as f:
            f.write(f"Error: {e}\n")
        print(f"Error occurred. Check {output_path}")
    finally:
        db.close()

if __name__ == "__main__":
    check_bids()
