from database import engine
from sqlalchemy import text

def inspect_constraint():
    with engine.connect() as conn:
        print("Fetching check constraints for table 'trips'...")
        # For PostgreSQL
        sql = text("""
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE contype = 'c' AND conrelid = 'trips'::regclass;
        """)
        results = conn.execute(sql).fetchall()
        for row in results:
            print(f"Constraint: {row[0]}, Definition: {row[1]}")

if __name__ == "__main__":
    inspect_constraint()
