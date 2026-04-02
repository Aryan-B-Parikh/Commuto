import sys
import os
import uuid
import json
import time
import requests
import pytest
from decimal import Decimal
from datetime import datetime, timedelta

# Path setup
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE_URL = "http://localhost:8000"

def get_auth_headers(email, password="password123"):
    try:
        r = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
        r.raise_for_status()
        token = r.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    except Exception:
        # Register if login fails
        requests.post(f"{BASE_URL}/auth/register", json={
            "email": email, "password": password, "full_name": "Test User", "phone": "1234567890", "role": "passenger"
        })
        # Try login again
        r = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
        return {"Authorization": f"Bearer {r.json()['access_token']}"}

def add_funds_manually(email, amount):
    import subprocess
    py_code = f"""
import sys
import os
sys.path.append(os.getcwd())
try:
    from decimal import Decimal
    from database import SessionLocal
    from models import User, Wallet
    db = SessionLocal()
    user = db.query(User).filter(User.email == '{email}').first()
    if not user:
        print("User not found")
        sys.exit(1)
    wallet = db.query(Wallet).filter(Wallet.user_id == user.id).first()
    if not wallet:
        import uuid
        wallet = Wallet(id=uuid.uuid4(), user_id=user.id, balance=Decimal('0'))
        db.add(wallet)
    wallet.balance += Decimal('{amount}')
    db.commit()
    db.close()
except Exception as e:
    print(f"Subprocess error: {{e}}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
"""
    # Ensure we don't inherit a test DATABASE_URL from conftest.py if running via pytest
    env = os.environ.copy()
    if "DATABASE_URL" in env:
        del env["DATABASE_URL"]
        
    result = subprocess.run(
        ["venv\\Scripts\\python.exe", "-c", py_code], 
        capture_output=True, 
        text=True,
        cwd=os.getcwd(),
        env=env
    )
    if result.returncode != 0:
        print(f"STDOUT: {result.stdout}")
        print(f"STDERR: {result.stderr}")
        raise Exception(f"Failed to add funds manually for {email}")

class TestCommutoHardening:

    @pytest.fixture(scope="class")
    def setup_users(self):
        u1 = f"stress_p1_{uuid.uuid4().hex[:6]}@example.com"
        u2 = f"stress_p2_{uuid.uuid4().hex[:6]}@example.com"
        d1 = f"stress_d1_{uuid.uuid4().hex[:6]}@example.com"
        
        # Register and complete profile for all
        for e, role in [(u1, "passenger"), (u2, "passenger"), (d1, "driver")]:
            r = requests.post(f"{BASE_URL}/auth/register", json={
                "email": e, "password": "password123", "full_name": "QA Tester", "phone": "1234567890", "role": role
            })
            if r.status_code == 429:
                # If rate limited, we might already have this user from a previous failed run? 
                # Or just wait? Here we'll just try to login.
                pass 
            
            h = get_auth_headers(e)
            if not h: # If login fails too
                pytest.skip("Rate limited during setup. Wait 60s.")
            requests.patch(f"{BASE_URL}/auth/me", json={
                "gender": "male", "date_of_birth": "1990-01-01", 
                "emergency_contact": {"name": "EC", "phone": "000"},
                "full_name": "Stress Tester", "phone_number": "1234567890",
                "license_number": "LIC123" if role == "driver" else None,
                "vehicle_model": "Tesla" if role == "driver" else None,
                "vehicle_plate": "QA-01" if role == "driver" else None,
                "vehicle_type": "Sedan" if role == "driver" else None
            }, headers=h)
            add_funds_manually(e, 5000)
            
        return {
            "p1": {"email": u1, "headers": get_auth_headers(u1)},
            "p2": {"email": u2, "headers": get_auth_headers(u2)},
            "d1": {"email": d1, "headers": get_auth_headers(d1)}
        }

    def test_email_uniqueness(self, setup_users):
        """Reject duplicate registration"""
        email = setup_users["p1"]["email"]
        r = requests.post(f"{BASE_URL}/auth/register", json={
            "email": email, "password": "password123", "full_name": "Dope", "phone": "000", "role": "passenger"
        })
        assert r.status_code == 400
        assert "Email already registered" in r.text

    def test_malformed_email(self):
        """Pydantic EmailStr validation"""
        r = requests.post(f"{BASE_URL}/auth/register", json={
            "email": "not-an-email", "password": "password123", "full_name": "X", "phone": "0", "role": "passenger"
        })
        assert r.status_code == 422

    def test_seat_boundaries(self, setup_users):
        """Seats must be 1-4"""
        h = setup_users["p1"]["headers"]
        base_data = {
            "from_location": {"address": "A", "lat": 0, "lng": 0},
            "to_location": {"address": "B", "lat": 1, "lng": 1},
            "date": "2030-01-01", "time": "12:00", "total_price": 100
        }
        # 0 seats
        r = requests.post(f"{BASE_URL}/rides/create-shared", json={**base_data, "total_seats": 0}, headers=h)
        assert r.status_code == 422
        # 5 seats
        r = requests.post(f"{BASE_URL}/rides/create-shared", json={**base_data, "total_seats": 5}, headers=h)
        assert r.status_code == 422

    def test_temporal_constraint(self, setup_users):
        """Cannot create ride in the past"""
        h = setup_users["p1"]["headers"]
        past_date = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
        r = requests.post(f"{BASE_URL}/rides/create-shared", json={
            "from_location": {"address": "A", "lat": 0, "lng": 0},
            "to_location": {"address": "B", "lat": 1, "lng": 1},
            "date": past_date, "time": "12:00", "total_seats": 4, "total_price": 100
        }, headers=h)
        assert r.status_code == 400
        assert "future" in r.text

    def test_payload_size(self, setup_users):
        """Notes max 500 chars"""
        h = setup_users["p1"]["headers"]
        long_note = "A" * 501
        base_data = {
            "from_location": {"address": "A", "lat": 0, "lng": 0},
            "to_location": {"address": "B", "lat": 1, "lng": 1},
            "date": "2030-01-01", "time": "12:00", "total_seats": 4, "total_price": 100,
            "notes": long_note
        }
        r = requests.post(f"{BASE_URL}/rides/create-shared", json=base_data, headers=h)
        assert r.status_code == 422

    def test_negative_monetary(self, setup_users):
        """Reject negative wallet top-up"""
        h = setup_users["p1"]["headers"]
        r = requests.post(f"{BASE_URL}/wallet/transfer", json={
            "recipient_email": setup_users["p2"]["email"], "amount": -100
        }, headers=h)
        assert r.status_code == 422 # Pydantic gt=0

    def test_wallet_upper_boundary(self, setup_users):
        """Reject top-up > 50000"""
        h = setup_users["p1"]["headers"]
        r = requests.post(f"{BASE_URL}/wallet/add-money", json={"amount": 50001}, headers=h)
        assert r.status_code == 422

    def test_self_bidding(self, setup_users):
        """Driver cannot bid on own ride"""
        # Create ride as Driver (multi-role)
        email = setup_users["d1"]["email"]
        h = setup_users["d1"]["headers"]
        r = requests.post(f"{BASE_URL}/rides/create-shared", json={
            "from_location": {"address": "A", "lat": 0, "lng": 0},
            "to_location": {"address": "B", "lat": 1, "lng": 1},
            "date": "2030-01-02", "time": "15:00", "total_seats": 4, "total_price": 500
        }, headers=h)
        ride_id = r.json()["id"]
        
        # Try to bid on it
        r = requests.post(f"{BASE_URL}/bids/{ride_id}", json={"amount": 400}, headers=h)
        assert r.status_code == 400
        assert "own" in r.text

    def test_rate_limiting_threshold(self, setup_users):
        """Verify 429 after 6 registrations (threshold is 6). 
        Note: setup_users fixture already performed 3 registrations (p1, p2, d1).
        So we should hit 429 on the 4th attempt here (3+4=7).
        """
        email_base = f"spam_{uuid.uuid4().hex[:6]}"
        for i in range(1, 10):
            r = requests.post(f"{BASE_URL}/auth/register", json={
                "email": f"{email_base}_{i}@test.com", "password": "password123", 
                "full_name": "Spammer", "phone": "000", "role": "passenger"
            })
            # Threshold is 6. We have 3 from setup.
            expected_limit_at = 6 - 3 + 1 # 4th attempt here
            if i >= expected_limit_at:
                assert r.status_code == 429, f"Request {i} (total {i+3}) should have been rate limited"
            else:
                assert r.status_code == 201 or r.status_code == 400

    def test_otp_consistency(self, setup_users):
        """Verify 6-digit OTP generation and double verification rejection"""
        p1_h = setup_users["p1"]["headers"]
        d1_h = setup_users["d1"]["headers"]
        
        # 1. Create Ride
        r = requests.post(f"{BASE_URL}/rides/create-shared", json={
            "from_location": {"address": "A", "lat": 0, "lng": 0},
            "to_location": {"address": "B", "lat": 1, "lng": 1},
            "date": "2030-01-03", "time": "10:00", "total_seats": 2, "total_price": 200
        }, headers=p1_h)
        ride_id = r.json()["id"]
        
        # 2. Driver Bid
        requests.post(f"{BASE_URL}/bids/{ride_id}", json={"amount": 200}, headers=d1_h)
        bid_id = requests.get(f"{BASE_URL}/bids/{ride_id}/all", headers=p1_h).json()[0]["id"]
        
        # 3. Accept Bid -> Get 6-digit OTP
        r = requests.post(f"{BASE_URL}/bids/{bid_id}/accept", headers=p1_h)
        otp = r.json()["otp"]
        assert len(otp) == 6
        
        # 4. Verify OTP (Start Ride)
        requests.post(f"{BASE_URL}/rides/{ride_id}/verify-otp", json={"otp": otp}, headers=d1_h).raise_for_status()
        
        # 5. Double Verify (Should fail)
        r = requests.post(f"{BASE_URL}/rides/{ride_id}/verify-otp", json={"otp": otp}, headers=d1_h)
        assert r.status_code == 400
        assert "already verified" in r.text

if __name__ == "__main__":
    pytest.main([__file__])
