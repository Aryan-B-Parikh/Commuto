"""
Fix trips_status_check constraint using psycopg2 directly.
Bypasses SQLAlchemy connection pool to avoid lock contention.
"""
import psycopg2
import urllib.parse

# Parse the connection URL
db_url = "postgresql://postgres:Jaimin%40123@localhost:5432/Commuto"
# psycopg2 accepts URL directly
conn = psycopg2.connect(db_url)
conn.autocommit = True  # Use autocommit to avoid waiting for shared locks

cursor = conn.cursor()

print("=== Current trips constraints ===")
cursor.execute("""
    SELECT conname, pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE conrelid = 'trips'::regclass AND contype = 'c'
""")
rows = cursor.fetchall()
for r in rows:
    print(r)

print("\n=== Dropping old constraint ===")
cursor.execute("ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check")
print("Dropped.")

print("\n=== Adding new constraint with all valid statuses ===")
cursor.execute("""
    ALTER TABLE trips ADD CONSTRAINT trips_status_check 
    CHECK (status IN ('pending', 'bid_accepted', 'driver_assigned', 'scheduled', 'active', 'completed', 'cancelled'))
""")
print("Added.")

print("\n=== New trips constraints ===")
cursor.execute("""
    SELECT conname, pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE conrelid = 'trips'::regclass AND contype = 'c'
""")
rows = cursor.fetchall()
for r in rows:
    print(r)

cursor.close()
conn.close()
print("\nDone!")
