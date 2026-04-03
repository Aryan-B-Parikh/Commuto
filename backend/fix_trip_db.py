from sqlalchemy import text
from database import engine

def main():
    print("Connecting to database...")
    with engine.connect() as conn:
        print("Terminating active connections to avoid locks...")
        try:
            conn.execute(text("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'Commuto' AND pid <> pg_backend_pid()"))
            conn.commit()
        except Exception as e:
            print(f"Non-critical failure while terminating connections: {e}")

        print("Fixing trips_status_check constraint...")
        try:
            # 1. Drop existing constraint
            conn.execute(text("ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check"))
            
            # 2. Add new, more inclusive constraint
            conn.execute(text("""
                ALTER TABLE trips 
                ADD CONSTRAINT trips_status_check 
                CHECK (status IN ('pending', 'available', 'upcoming', 'active', 'completed', 'cancelled'))
            """))
            
            # 3. Repeat for payment_status if needed
            conn.execute(text("ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_payment_status_check"))
            conn.execute(text("""
                ALTER TABLE trips 
                ADD CONSTRAINT trips_payment_status_check 
                CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'))
            """))
            
            conn.commit()
            print("Successfully updated constraints for 'trips' table.")
            
            # Verify
            result = conn.execute(text("SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'trips'::regclass"))
            print("\nCurrent constraints on 'trips':")
            for row in result:
                print(f" - {row[0]}: {row[1]}")
                
        except Exception as e:
            conn.rollback()
            print(f"FAILED to update constraints: {e}")

if __name__ == "__main__":
    main()
