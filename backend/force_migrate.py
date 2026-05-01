import sys
import os
from sqlalchemy import text
from database import engine

def force_migrate():
    print("Attempting to add 'created_by_role' to 'trip_bids'...")
    try:
        with engine.connect() as conn:
            # Check if column exists
            check_sql = text("SELECT column_name FROM information_schema.columns WHERE table_name='trip_bids' AND column_name='created_by_role'")
            result = conn.execute(check_sql).fetchone()
            
            if not result:
                print("Column missing. Adding it...")
                conn.execute(text("ALTER TABLE trip_bids ADD COLUMN created_by_role VARCHAR(20)"))
                conn.commit()
                print("SUCCESS: Column added.")
            else:
                print("Column already exists.")
    except Exception as e:
        print(f"MIGRATION ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    force_migrate()
