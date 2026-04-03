from database import engine
from sqlalchemy import text

def quick_fix():
    print("Connecting for quick fix...")
    with engine.connect() as conn:
        print("Connected. Running ALTER TABLE...")
        conn.execute(text("ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_url TEXT"))
        conn.execute(text("ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_photo_url TEXT"))
        conn.execute(text("ALTER TABLE drivers ADD COLUMN IF NOT EXISTS insurance_expiry DATE"))
        conn.execute(text("ALTER TABLE drivers ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 0.0"))
        conn.execute(text("ALTER TABLE drivers ADD COLUMN IF NOT EXISTS total_trips INTEGER DEFAULT 0"))
        conn.execute(text("ALTER TABLE drivers ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE"))
        conn.execute(text("ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP"))
        conn.commit()
        print("Quick fix committed.")

if __name__ == "__main__":
    quick_fix()
