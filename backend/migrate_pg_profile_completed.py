import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    if not DATABASE_URL or not DATABASE_URL.startswith("postgresql"):
        print("DATABASE_URL is not set to postgresql. Skipping.")
        return

    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='profile_completed'
        """)
        exists = cursor.fetchone()
        
        if not exists:
            print("Adding profile_completed column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN profile_completed BOOLEAN DEFAULT FALSE")
            print("Migration successful.")
        else:
            print("profile_completed column already exists.")
            
        conn.commit()
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
