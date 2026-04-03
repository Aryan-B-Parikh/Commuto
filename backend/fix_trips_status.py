from sqlalchemy import text
from database import engine

def fix_status_constraint():
    print("Connecting to database to fix 'trips_status_check'...")
    with engine.connect() as conn:
        try:
            # 1. Drop existing constraint if it exists
            # We use a broad check for any constraint on the status column of trips
            print("Dropping existing status constraint if it exists...")
            conn.execute(text("ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;"))
            
            # 2. Add the comprehensive constraint
            print("Adding updated trips_status_check with 'pending' status support...")
            conn.execute(text("""
                ALTER TABLE trips 
                ADD CONSTRAINT trips_status_check 
                CHECK (status IN ('pending', 'driver_assigned', 'bid_accepted', 'active', 'completed', 'cancelled', 'failed'));
            """))
            
            conn.commit()
            print("Successfully updated 'trips_status_check' constraint!")
            
        except Exception as e:
            print(f"Error updating constraint: {e}")
            conn.rollback()

if __name__ == "__main__":
    fix_status_constraint()
