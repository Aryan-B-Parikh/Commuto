import asyncio
from sqlalchemy.orm import Session
from database import SessionLocal
import schemas
import models
from routers.auth_router import register
from fastapi import Request
from uuid import uuid4

def test_internal_register():
    db = SessionLocal()
    unique_email = f"test_{uuid4().hex}@example.com"
    user_data = schemas.UserRegister(
        email=unique_email,
        password="password123",
        full_name="Test User",
        phone="1234567890",
        role="passenger"
    )
    
    # Mocking Request the way it's used in rate_limit
    class MockRequest:
        def __init__(self):
            self.client = type('obj', (object,), {'host': '127.0.0.1'})
            self.url = type('obj', (object,), {'path': '/auth/register'})
            self.scope = {'type': 'http'}
    
    request = MockRequest()
    
    try:
        print(f"Registering internal with email: {unique_email}")
        # Note: register has @rate_limit which might interfere if not handled
        # But we can call the original function if we get it from __wrapped__ or just call it
        # Actually rate_limit is a decorator. Let's see if we can call it.
        result = register(request=request, user_data=user_data, db=db)
        print("Success!")
        print(result)
    except Exception as e:
        print(f"FAILED with error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_internal_register()
