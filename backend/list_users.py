import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("SELECT id, email, full_name, role FROM users;")
    rows = cur.fetchall()
    print("Users in database:")
    for row in rows:
        print(f"ID: {row[0]}, Email: {row[1]}, Name: {row[2]}, Role: {row[3]}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
