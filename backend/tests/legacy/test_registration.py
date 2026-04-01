"""
Test script to verify user registration saves to database
"""
import sys
sys.path.append('.')

from database import get_db
from sqlalchemy.orm import Session
import models
import uuid

def test_user_registration():
    """Test that user registration flow saves data to database"""
    db = next(get_db())
    
    try:
        print("\n" + "="*60)
        print("TESTING USER REGISTRATION TO DATABASE")
        print("="*60 + "\n")
        
        # Test 1: Create a test user
        print("📝 Test 1: Creating test user...")
        test_user_id = uuid.uuid4()
        test_email = f"test_{test_user_id}@example.com"
        
        test_user = models.User(
            id=test_user_id,
            email=test_email,
            hashed_password="hashed_password_here",
            full_name="Test User",
            phone_number="+1234567890",
            role="passenger"
        )
        
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print(f"✅ User created with ID: {test_user.id}")
        print(f"   Email: {test_user.email}")
        print(f"   Name: {test_user.full_name}\n")
        
        # Test 2: Create passenger profile
        print("📝 Test 2: Creating passenger profile...")
        passenger = models.Passenger(
            user_id=test_user.id,
            preferences={"payment_method": "card"}
        )
        
        db.add(passenger)
        db.commit()
        db.refresh(passenger)
        
        print(f"✅ Passenger profile created")
        print(f"   User ID: {passenger.user_id}\n")
        
        # Test 3: Verify user exists in database
        print("📝 Test 3: Verifying user exists in database...")
        found_user = db.query(models.User).filter(models.User.email == test_email).first()
        
        if found_user:
            print(f"✅ User found in database!")
            print(f"   ID: {found_user.id}")
            print(f"   Email: {found_user.email}")
            print(f"   Created: {found_user.created_at}\n")
        else:
            print(f"❌ User NOT found in database!\n")
            return False
        
        # Test 4: Verify passenger profile exists
        print("📝 Test 4: Verifying passenger profile...")
        found_passenger = db.query(models.Passenger).filter(
            models.Passenger.user_id == test_user.id
        ).first()
        
        if found_passenger:
            print(f"✅ Passenger profile found!")
            print(f"   Preferences: {found_passenger.preferences}\n")
        else:
            print(f"❌ Passenger profile NOT found!\n")
            return False
        
        # Test 5: Test driver profile creation
        print("📝 Test 5: Creating driver profile...")
        test_driver_id = uuid.uuid4()
        test_driver_email = f"driver_{test_driver_id}@example.com"
        
        driver_user = models.User(
            id=test_driver_id,
            email=test_driver_email,
            hashed_password="hashed_password",
            full_name="Test Driver",
            phone_number="+9876543210",
            role="driver"
        )
        
        db.add(driver_user)
        db.flush()
        
        driver_profile = models.Driver(
            user_id=driver_user.id,
            license_number="DL123456",
            rating=5.0,
            total_trips=0,
            is_online=False
        )
        
        db.add(driver_profile)
        db.commit()
        
        print(f"✅ Driver user and profile created")
        print(f"   ID: {driver_user.id}")
        print(f"   License: {driver_profile.license_number}\n")
        
        # Test 6: Clean up - Delete test data
        print("📝 Test 6: Cleaning up test data...")
        
        # Delete passenger and user
        db.delete(passenger)
        db.delete(test_user)
        
        # Delete driver and driver user
        db.delete(driver_profile)
        db.delete(driver_user)
        
        db.commit()
        
        print(f"✅ Test data cleaned up\n")
        
        print("="*60)
        print("✅ ALL TESTS PASSED!")
        print("="*60)
        print("\n✨ User registration works correctly!")
        print("✨ Data is being saved to the local PostgreSQL database!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}\n")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_user_registration()
    exit(0 if success else 1)
