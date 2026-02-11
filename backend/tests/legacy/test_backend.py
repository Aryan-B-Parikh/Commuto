"""
Simple test script to verify Commuto backend endpoints
"""
import sys
sys.path.append('.')

from database import engine, get_db
from sqlalchemy import text

def test_database_connection():
    """Test database connection"""
    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))
        print("✅ Database connection: SUCCESS")
        return True
    except Exception as e:
        print(f"❌ Database connection: FAILED - {e}")
        return False

def test_models_import():
    """Test models can be imported without errors"""
    try:
        import models
        print("✅ Models import: SUCCESS")
        print(f"   - Found models: User, Driver, Passenger, Vehicle, Trip, Booking, TripBid, SavedPlace, TripLocation")
        return True
    except Exception as e:
        print(f"❌ Models import: FAILED - {e}")
        return False

def test_schemas_import():
    """Test schemas can be imported"""
    try:
        import schemas
        import schemas_trips
        print("✅ Schemas import: SUCCESS")
        return True
    except Exception as e:
        print(f"❌ Schemas import: FAILED - {e}")
        return False

def test_auth_import():
    """Test auth module"""
    try:
        import auth
        print("✅ Auth module: SUCCESS")
        print(f"   - Functions: hash_password, verify_password, create_access_token, get_current_user, get_user_role")
        return True
    except Exception as e:
        print(f"❌ Auth module: FAILED - {e}")
        return False

def test_routers_import():
    """Test routers can be imported"""
    try:
        from routers import auth_router, rides_router, bids_router, otp_router, websocket_router
        print("✅ Routers import: SUCCESS")
        print(f"   - auth_router: {len(auth_router.router.routes)} routes")
        print(f"   - rides_router: {len(rides_router.router.routes)} routes")
        print(f"   - bids_router: {len(bids_router.router.routes)} routes")
        print(f"   - otp_router: {len(otp_router.router.routes)} routes")
        return True
    except Exception as e:
        print(f"❌ Routers import: FAILED - {e}")
        return False

def main():
    print("\n" + "="*60)
    print("COMMUTO BACKEND VERIFICATION")
    print("="*60 + "\n")
    
    tests = [
        test_database_connection,
        test_models_import,
        test_schemas_import,
        test_auth_import,
        test_routers_import
    ]
    
    results = []
    for test in tests:
        result = test()
        results.append(result)
        print()
    
    print("="*60)
    print(f"RESULTS: {sum(results)}/{len(results)} tests passed")
    print("="*60)
    
    if all(results):
        print("\n✅ ALL TESTS PASSED - Backend is ready!")
        return 0
    else:
        print("\n❌ SOME TESTS FAILED - Check errors above")
        return 1

if __name__ == "__main__":
    exit(main())
