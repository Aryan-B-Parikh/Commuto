import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

print(f"Connecting to {DATABASE_URL}")
try:
    engine = create_engine(DATABASE_URL, connect_args={'connect_timeout': 10})
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("Connection successful!")
        print(f"Result: {result.fetchone()}")
except Exception as e:
    print(f"Connection failed: {e}")
