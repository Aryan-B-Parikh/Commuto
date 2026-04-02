"""Add profile_completed column to users table.

Run: python migrate_profile_completed.py
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "commuto.db")


def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if column already exists
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]

    if "profile_completed" not in columns:
        cursor.execute(
            "ALTER TABLE users ADD COLUMN profile_completed BOOLEAN DEFAULT 0"
        )
        print("[OK] Added profile_completed column to users table.")
    else:
        print("[INFO] profile_completed column already exists.")

    # Back-fill: mark existing users who already have gender + DOB + emergency_contact
    cursor.execute("""
        UPDATE users
        SET profile_completed = 1
        WHERE gender IS NOT NULL
          AND date_of_birth IS NOT NULL
          AND emergency_contact IS NOT NULL
          AND profile_completed = 0
    """)
    backfilled = cursor.rowcount
    if backfilled:
        print(f"[OK] Back-filled {backfilled} existing user(s) as profile_completed.")

    conn.commit()
    conn.close()
    print("Migration complete.")


if __name__ == "__main__":
    migrate()
