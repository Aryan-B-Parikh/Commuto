from database import engine, Base
import models
import sys

print("Attempting to connect and create schema...")
try:
    Base.metadata.create_all(bind=engine)
    print("Schema creation successful!")
    sys.exit(0)
except Exception as e:
    print(f"Schema creation failed: {e}")
    sys.exit(1)
