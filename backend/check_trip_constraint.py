from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT conname, pg_get_constraintdef(oid) 
        FROM pg_constraint 
        WHERE conrelid = 'trips'::regclass AND contype = 'c'
    """))
    rows = result.fetchall()
    if rows:
        for r in rows:
            print(r)
    else:
        print("No CHECK constraints found on trips table")
