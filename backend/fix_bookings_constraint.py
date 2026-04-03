from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check"))
    conn.execute(text("ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'in_progress'))"))
    conn.commit()
    print("Updated bookings_status_check constraint")
