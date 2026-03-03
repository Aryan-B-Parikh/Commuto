import sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from database import engine
from sqlalchemy import text

conn = engine.connect()

# Delete bookings referencing pending trips
r1 = conn.execute(text("DELETE FROM bookings WHERE trip_id IN (SELECT id FROM trips WHERE status = 'pending')"))
print(f'Deleted {r1.rowcount} bookings')

# Delete bids referencing pending trips
r2 = conn.execute(text("DELETE FROM trip_bids WHERE trip_id IN (SELECT id FROM trips WHERE status = 'pending')"))
print(f'Deleted {r2.rowcount} bids')

# Delete pending trips
r3 = conn.execute(text("DELETE FROM trips WHERE status = 'pending'"))
print(f'Deleted {r3.rowcount} pending trips')

conn.commit()
conn.close()
print('Done! Old test data cleaned up.')
