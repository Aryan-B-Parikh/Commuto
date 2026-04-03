import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def check_trips():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, start_time, dest_address, status FROM trips ORDER BY created_at DESC LIMIT 5"))
        for row in result:
            print(f"ID: {row.id}, Start Time: {row.start_time}, Dest: {row.dest_address}, Status: {row.status}")

if __name__ == "__main__":
    try:
        check_trips()
    except Exception as e:
        print(f"Error: {e}")
