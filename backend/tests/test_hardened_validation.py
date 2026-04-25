import os

import pytest
import requests
import uuid

BASE_URL = "http://localhost:8000"

pytestmark = pytest.mark.skipif(
    os.getenv("RUN_LIVE_API_TESTS") != "1",
    reason="Requires a running backend at http://localhost:8000; set RUN_LIVE_API_TESTS=1 to enable.",
)

def test_hardened_validation():
    print("--- Starting Hardened Validation Verification (Rikshaw & Email) ---")
    
    # 1. Email Validation Tests
    email_cases = [
        ("john.doe@gmail.com", True),
        ("test@test.com", False),    # Banned pattern
        ("a@a.com", False),          # Banned pattern
        ("user@domain.i", False),    # TLD too short (frontend/schema logic)
        ("user@domain.com", True),
        ("no_at_symbol", False),
    ]
    
    for email, expected in email_cases:
        payload = {
            "email": email,
            "password": "Password123!",
            "full_name": "Test User",
            "phone": "9876543210",
            "role": "passenger"
        }
        resp = requests.post(f"{BASE_URL}/auth/register", json=payload)
        status_ok = resp.status_code == 201
        if status_ok == expected:
            print(f"PASS: Email '{email}' result matches expected ({expected})")
        else:
            print(f"FAIL: Email '{email}' result {status_ok} vs expected {expected}. Body: {resp.json() if not status_ok else 'Success'}")

    # 2. Rikshaw Capacity Tests
    capacity_cases = [
        (3, True),
        (4, True),
        (5, False),
        (0, False),
    ]
    
    for cap, expected in capacity_cases:
        # We test this via register (driver role)
        email = f"driver_{uuid.uuid4().hex[:6]}@example.com"
        payload = {
            "email": email,
            "password": "Password123!",
            "full_name": "Test Driver",
            "phone": "9876543210",
            "role": "driver",
            "vehicle_capacity": cap
        }
        resp = requests.post(f"{BASE_URL}/auth/register", json=payload)
        status_ok = resp.status_code == 201
        if status_ok == expected:
            print(f"PASS: Capacity '{cap}' result matches expected ({expected})")
        else:
            print(f"FAIL: Capacity '{cap}' result {status_ok} vs expected {expected}. Body: {resp.json() if not status_ok else 'Success'}")

    print("\n--- Hardened Validation Verification Complete ---")

if __name__ == "__main__":
    test_hardened_validation()
