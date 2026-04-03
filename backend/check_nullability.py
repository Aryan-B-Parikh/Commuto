import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    cur.execute("""
        SELECT column_name, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'drivers'
    """)
    cols = cur.fetchall()
    print("Drivers columns nullability:")
    for col in cols:
        print(f"  - {col[0]}: {col[1]}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
