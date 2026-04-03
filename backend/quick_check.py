import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'drivers'")
    cols = cur.fetchall()
    print(f"Drivers columns: {cols}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
