from database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;"))
        conn.execute(text("ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_payment_status_check;"))
        conn.commit()
    print("Dropped payment_status check constraints successfully.")
except Exception as e:
    print(f"Error dropping constraints: {e}")
