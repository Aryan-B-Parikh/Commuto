import sys
import os

# Add the current directory to path so we can import auth
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import auth

def test_auth():
    print("Testing auth fix...")
    
    password = "secure_password_123"
    
    # Test hashing
    print(f"Hashing password: {password}")
    hashed = auth.hash_password(password)
    print(f"Hashed: {hashed}")
    
    # Test verification
    print("Verifying correct password...")
    assert auth.verify_password(password, hashed) is True
    print("Verification successful!")
    
    print("Verifying incorrect password...")
    assert auth.verify_password("wrong_password", hashed) is False
    print("Incorrect password rejection successful!")
    
    # Test 72 byte limit
    long_password = "a" * 73
    print("Testing password longer than 72 bytes...")
    try:
        auth.hash_password(long_password)
        print("Error: Should have raised HTTPException for long password")
    except Exception as e:
        print(f"Caught expected exception for long password: {e}")

if __name__ == "__main__":
    try:
        test_auth()
        print("\nAll tests passed successfully!")
    except AssertionError as e:
        print(f"\nTest failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nAn error occurred: {e}")
        sys.exit(1)
