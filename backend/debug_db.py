import sys
import traceback
from database import engine, Base
import models

try:
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created successfully!")
except Exception as e:
    print(f"✗ Error creating tables:")
    print(f"Error type: {type(e).__name__}")
    print(f"Error message: {str(e)}")
    print("\nFull traceback:")
    traceback.print_exc()
    sys.exit(1)
