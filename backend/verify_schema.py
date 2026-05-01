from database import engine
from sqlalchemy import text

def check_schema():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='trip_bids'"))
        columns = [row[0] for row in result.fetchall()]
        print(f"Columns in trip_bids: {columns}")
        if 'created_by_role' in columns:
            print("SUCCESS: created_by_role exists.")
        else:
            print("FAILURE: created_by_role missing.")

if __name__ == "__main__":
    check_schema()
