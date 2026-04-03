import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
url = os.getenv("DATABASE_URL")

try:
    with psycopg2.connect(url) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT column_name, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'drivers'
            """)
            cols = cur.fetchall()
            with open("nullability_output.txt", "w") as f:
                f.write("Drivers columns nullability:\n")
                for col in cols:
                    f.write(f"  - {col[0]}: {col[1]}\n")
except Exception as e:
    with open("nullability_error.txt", "w") as f:
        f.write(f"Error: {str(e)}")
