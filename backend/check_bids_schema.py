from sqlalchemy import create_engine, inspect
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
inspector = inspect(engine)

print(f"Columns for trip_bids:")
cols = inspector.get_columns('trip_bids')
for c in cols:
    print(f"- {c['name']}: {c['type']}")
