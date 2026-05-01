from database import engine
from sqlalchemy import text

def cleanup():
    print("Dropping 'created_by_role' from 'trip_bids'...")
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE trip_bids DROP COLUMN IF EXISTS created_by_role"))
            conn.commit()
            print("SUCCESS: Column dropped.")
    except Exception as e:
        print(f"CLEANUP ERROR: {str(e)}")

if __name__ == "__main__":
    cleanup()
