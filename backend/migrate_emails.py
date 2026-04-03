import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def migrate_emails_to_lowercase():
    print("Connecting to database...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Select all users to see what we're dealing with
        cur.execute("SELECT id, email FROM users;")
        users = cur.fetchall()
        print(f"Checking {len(users)} users for email standardization...")
        
        updates = 0
        for user_id, email in users:
            if email != email.lower():
                print(f"Updating '{email}' to '{email.lower()}'...")
                cur.execute("UPDATE users SET email = %s WHERE id = %s;", (email.lower(), user_id))
                updates += 1
        
        conn.commit()
        print(f"Done. Standardized {updates} user emails to lowercase.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Migration error: {e}")

if __name__ == "__main__":
    migrate_emails_to_lowercase()
