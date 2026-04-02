import sqlite3
import os

DB_PATH = "commuto.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"DB not found at {DB_PATH}. Skipping migration.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(trips)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if "total_price" not in columns:
            print("Adding total_price column to trips table...")
            cursor.execute("ALTER TABLE trips ADD COLUMN total_price NUMERIC DEFAULT 0")
            # Backfill total_price with price_per_seat * (total_seats)?
            # User wants total to be total, so let's just use price_per_seat as the initial total.
            cursor.execute("UPDATE trips SET total_price = price_per_seat")
            conn.commit()
            print("Migration successful.")
        else:
            print("total_price column already exists.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
