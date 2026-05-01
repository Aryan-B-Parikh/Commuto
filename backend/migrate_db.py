import sys
import os

# Add the current directory to sys.path to import local modules
sys.path.append(os.getcwd())

from database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        print("Checking for created_by_role column...")
        # Check if column exists
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='trip_bids' AND column_name='created_by_role'"))
        if not result.fetchone():
            print("Adding created_by_role column to trip_bids table...")
            conn.execute(text("ALTER TABLE trip_bids ADD COLUMN created_by_role VARCHAR(20)"))
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column already exists.")

if __name__ == "__main__":
    migrate()
