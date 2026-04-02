import requests
import uuid

BASE_URL = "http://localhost:8000"

def test_phone_validation():
    print("--- Starting Indian Phone Validation Verification ---")
    
    test_cases = [
        ("9876543210", True),     # Valid
        ("+91 8866778958", True),  # Valid with prefix/space
        ("7000000001", True),     # Valid
        ("1234567890", False),    # Invalid start (1)
        ("5555555555", False),    # Invalid start (5)
        ("9999999999", False),    # Repetitive
        ("8888888888", False),    # Repetitive
        ("987654321", False),     # Too short (9 digits)
        ("98765432101", False),   # Too long (11 digits)
    ]
    
    for phone, expected in test_cases:
        email = f"test_{uuid.uuid4().hex[:6]}@example.com"
        payload = {
            "email": email,
            "password": "password123",
            "full_name": "Test User",
            "phone": phone,
            "role": "passenger"
        }
        
        resp = requests.post(f"{BASE_URL}/auth/register", json=payload)
        
        if expected:
            if resp.status_code == 201:
                print(f"PASS: '{phone}' accepted as expected.")
            else:
                print(f"FAIL: '{phone}' rejected but should be valid. Status: {resp.status_code}, Body: {resp.json()}")
        else:
            if resp.status_code == 422:
                print(f"PASS: '{phone}' rejected as expected.")
            else:
                print(f"FAIL: '{phone}' accepted but should be invalid. Status: {resp.status_code}")

    print("\n--- Phone Validation Verification Complete ---")

if __name__ == "__main__":
    test_phone_validation()
