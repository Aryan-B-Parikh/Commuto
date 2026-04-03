import psycopg2
import sys

def fix_db():
    conn_str = "postgresql://postgres:Jaimin%40123@localhost:5432/Commuto"
    try:
        print(f"Connecting to {conn_str}...")
        conn = psycopg2.connect(conn_str)
        conn.autocommit = True
        cur = conn.cursor()
        
        print("Dropping existing constraints on 'trips'...")
        cur.execute("ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check")
        cur.execute("ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_payment_status_check")
        
        print("Adding updated constraints...")
        # Trip Status: Added 'pending'
        cur.execute("""
            ALTER TABLE trips 
            ADD CONSTRAINT trips_status_check 
            CHECK (status IN ('pending', 'available', 'upcoming', 'active', 'completed', 'cancelled'))
        """)
        
        # Payment Status: Added 'pending'
        cur.execute("""
            ALTER TABLE trips 
            ADD CONSTRAINT trips_payment_status_check 
            CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'))
        """)
        
        print("Updated 'trips' table constraints successfully!")
        
        # Also check for bookings status check just in case
        print("Dropping existing constraints on 'bookings'...")
        cur.execute("ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check")
        cur.execute("""
            ALTER TABLE bookings 
            ADD CONSTRAINT bookings_status_check 
            CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled', 'rejected'))
        """)
        print("Updated 'bookings' table constraints successfully!")
        
        cur.close()
        conn.close()
        print("DONE.")
        
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    fix_db()
