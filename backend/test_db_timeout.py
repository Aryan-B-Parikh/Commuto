from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os
import sys

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

print(f"Connecting to: {DATABASE_URL.split('@')[-1]}")

try:
    # Use a small timeout for the connection
    engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 5})
    with engine.connect() as conn:
        print("Connected!")
        res = conn.execute(text("SELECT 1"))
        print(f"Result: {res.fetchone()}")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
