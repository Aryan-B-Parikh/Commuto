import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

# Database URL from .env
DATABASE_URL = "postgresql://postgres:Jaimin%40123@localhost:5432/Commuto"

# Add the current directory to sys.path
sys.path.append(os.getcwd())

import models

def check_bids():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        print("Checking TripBids...")
        bids = db.query(models.TripBid).all()
        if not bids:
            print("No bids found in database.")
        for bid in bids:
            print(f"ID: {bid.id}, Amount: {bid.bid_amount}, Status: {bid.status}, IsCounter: {bid.is_counter_bid}, Parent: {bid.parent_bid_id}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_bids()
