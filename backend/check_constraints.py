from sqlalchemy import text
from database import engine

def check_constraints():
    with engine.connect() as conn:
        # Query to find check constraints in PostgreSQL
        sql = text("""
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE contype = 'c' AND conname LIKE 'trips_%';
        """)
        result = conn.execute(sql)
        for row in result:
            print(f"Constraint: {row[0]}")
            print(f"Definition: {row[1]}")

if __name__ == "__main__":
    check_constraints()
