import psycopg2
import sys
import time

def run_permanent_fix():
    conn_str = "postgresql://postgres:Jaimin%40123@localhost:5432/Commuto"
    try:
        print(f"Connecting to {conn_str}...")
        conn = psycopg2.connect(conn_str)
        conn.autocommit = True
        cur = conn.cursor()
        
        # 1. Terminate other connections to release locks
        print("Terminating active connections on 'Commuto' database...")
        # We target both 'Commuto' and 'commuto' to be safe, regardless of case
        cur.execute("""
            SELECT pg_terminate_backend(pid) 
            FROM pg_stat_activity 
            WHERE (datname = 'Commuto' OR datname = 'commuto') 
            AND pid <> pg_backend_pid();
        """)
        print("Waiting 2 seconds for sessions to clear...")
        time.sleep(2)
        
        # 2. Fix TRIPS constraints
        print("Updating 'trips' table constraints...")
        # Drop all possible status-related constraints to be sure
        for constraint in ['trips_status_check', 'trips_payment_status_check']:
            cur.execute(f"ALTER TABLE trips DROP CONSTRAINT IF EXISTS {constraint}")
        
        cur.execute("""
            ALTER TABLE trips 
            ADD CONSTRAINT trips_status_check 
            CHECK (status IN ('pending', 'available', 'upcoming', 'active', 'completed', 'cancelled'))
        """)
        
        cur.execute("""
            ALTER TABLE trips 
            ADD CONSTRAINT trips_payment_status_check 
            CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'))
        """)
        
        # 3. Fix BOOKINGS constraints
        print("Updating 'bookings' table constraints...")
        cur.execute("ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check")
        cur.execute("""
            ALTER TABLE bookings 
            ADD CONSTRAINT bookings_status_check 
            CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled', 'rejected'))
        """)
        
        # 4. Also check for a common 'payments' table if it exists
        try:
            cur.execute("ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check")
            cur.execute("""
                ALTER TABLE payments 
                ADD CONSTRAINT payments_status_check 
                CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
            """)
        except:
            pass # Table might not exist yet
            
        print("\nSUCCESS: All status check constraints have been updated and synchronized.")
        print("The backend should now be able to insert 'pending' trips without violation errors.")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"\nCRITICAL ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_permanent_fix()
