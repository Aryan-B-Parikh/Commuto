import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

log_file = "connection_test_log.txt"

def log(msg):
    print(msg)
    with open(log_file, "a") as f:
        f.write(msg + "\n")

if os.path.exists(log_file):
    os.remove(log_file)

# Try to modify the URL to use direct connection instead of pooler
direct_url = DATABASE_URL.replace("-pooler", "") if DATABASE_URL else None

log(f"Testing direct connection to: {direct_url.split('@')[-1] if direct_url else 'None'}")

try:
    if direct_url:
        engine = create_engine(direct_url, connect_args={'connect_timeout': 10})
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            log("Direct connection successful!")
            log(f"Result: {result.fetchone()}")
    else:
        log("No direct URL derived.")
except Exception as e:
    log(f"Direct connection failed: {e}")

log("\n--- Testing original pooled connection ---")
try:
    if DATABASE_URL:
        engine = create_engine(DATABASE_URL, connect_args={'connect_timeout': 10})
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            log("Pooled connection successful!")
            log(f"Result: {result.fetchone()}")
    else:
        log("No DATABASE_URL found.")
except Exception as e:
    log(f"Pooled connection failed: {e}")
