import sys
import os
from sqlalchemy import create_engine, inspect

# Database URL from .env
DATABASE_URL = "postgresql://postgres:Jaimin%40123@localhost:5432/Commuto"

def check_columns():
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    columns = inspector.get_columns('trip_bids')
    print("Columns in trip_bids:")
    for col in columns:
        print(f"- {col['name']}")

if __name__ == "__main__":
    check_columns()
