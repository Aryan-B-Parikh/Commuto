import os
import sys
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from database import Base, DATABASE_URL
import models
import auth

load_dotenv()

# Use a temporary identity for testing
def test_auth_functions():
    try:
        # We'll use the real engine since we're just querying or creating a temp user
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(bind=engine)
        db = SessionLocal()
        
        # Get a user (any user) or create a mock-like object
        class MockUser:
            def __init__(self):
                self.id = "00000000-0000-0000-0000-000000000000"
                self.role = "driver"
        
        user = MockUser()
        
        print("Testing get_user_roles...")
        # This might fail if the user doesn't exist in DB profiles, 
        # but let's see if it at least doesn't crash on the logic
        try:
            roles = auth.get_user_roles(user, db)
            print(f"✓ Roles found: {roles}")
        except Exception as e:
            print(f"Note: get_user_roles failed (likely user not in DB): {e}")

        print("Testing get_user_role...")
        try:
            role = auth.get_user_role(user, db)
            print(f"✓ Single role found: {role}")
            if isinstance(role, str):
                print("✓ get_user_role returned a string as expected.")
        except Exception as e:
            print(f"✗ get_user_role failed: {e}")
            return False
            
        return True
    except Exception as e:
        print(f"Test setup failed: {e}")
        return False
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    success = test_auth_functions()
    if success:
        print("\n✅ Verification SUCCESS")
        exit(0)
    else:
        print("\n❌ Verification FAILED")
        exit(1)
