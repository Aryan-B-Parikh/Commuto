import sys
from pathlib import Path
import uuid
import requests
from decimal import Decimal
from datetime import datetime, timedelta, date

BACKEND_DIR = Path(__file__).resolve().parents[2]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

BASE_URL = "http://localhost:8000"

def get_balance(headers):
    r = requests.get(f"{BASE_URL}/wallet", headers=headers)
    r.raise_for_status()
    return Decimal(str(r.json()["balance"]))

def add_funds_manually(email, amount):
    import subprocess
    py_code = f"""
import uuid
from decimal import Decimal
from database import SessionLocal
from models import User, Wallet, Transaction
db = SessionLocal()
user = db.query(User).filter(User.email == '{email}').first()
wallet = db.query(Wallet).filter(Wallet.user_id == user.id).first()
if not wallet:
    wallet = Wallet(id=uuid.uuid4(), user_id=user.id, balance=Decimal('0'))
    db.add(wallet)
wallet.balance += Decimal('{amount}')
db.commit()
"""
    subprocess.run(["venv\\Scripts\\python.exe", "-c", py_code], cwd=str(BACKEND_DIR), check=True)

def test_hardened_features():
    print("--- Starting Post-Payment and Age Validation Verification ---")
    
    # 1. Setup Driver and 2 Passengers
    driver_email = f"driver_{uuid.uuid4().hex[:6]}@example.com"
    p1_email = f"p1_{uuid.uuid4().hex[:6]}@example.com"
    p2_email = f"p2_{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"
    
    users = [
        (driver_email, "Driver", "driver"),
        (p1_email, "Passenger 1", "passenger"),
        (p2_email, "Passenger 2", "passenger"),
    ]
    
    tokens = {}
    for email, name, role in users:
        requests.post(f"{BASE_URL}/auth/register", json={
            "email": email, "password": password, "full_name": name, "phone": "1234567890", "role": role
        }).raise_for_status()
        
        token = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password}).json()["access_token"]
        tokens[email] = token
        
        # Add funds
        add_funds_manually(email, 1000)

    h_driver = {"Authorization": f"Bearer {tokens[driver_email]}"}
    h_p1 = {"Authorization": f"Bearer {tokens[p1_email]}"}
    h_p2 = {"Authorization": f"Bearer {tokens[p2_email]}"}

    # 2. Test Age Validation (Task 1)
    print("\n[Testing Age Validation]")
    too_young_dob = (date.today() - timedelta(days=14*365)).isoformat() # 14 years old
    resp = requests.patch(f"{BASE_URL}/auth/me", json={"date_of_birth": too_young_dob}, headers=h_p1)
    if resp.status_code == 422:
        print("SUCCESS: 14-year-old DOB rejected correctly.")
    else:
        print(f"FAILED: 14-year-old DOB accepted? Status: {resp.status_code}, {resp.json()}")

    valid_dob = (date.today() - timedelta(days=16*365)).isoformat() # 16 years old
    requests.patch(f"{BASE_URL}/auth/me", json={"date_of_birth": valid_dob}, headers=h_p1).raise_for_status()
    print("SUCCESS: 16-year-old DOB accepted correctly.")

    # 3. Test Post-Ride Payment Flow
    print("\n[Testing Post-Ride Payment & Pricing Split]")
    
    # Create Ride ($300)
    ride_data = {
        "from_location": {"address": "City Center", "lat": 18.52, "lng": 73.85},
        "to_location": {"address": "Airport", "lat": 18.58, "lng": 73.91},
        "date": (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d"),
        "time": "14:00",
        "total_seats": 4,
        "total_price": 300.0
    }
    r = requests.post(f"{BASE_URL}/rides/create-shared", json=ride_data, headers=h_p1)
    r.raise_for_status()
    trip_id = r.json()["id"]
    
    # Verify NO deduction yet
    bal_p1 = get_balance(h_p1)
    print(f"P1 (Creator) balance after creation: {bal_p1}")
    assert bal_p1 == Decimal("1000.00"), "Money should NOT be deducted at creation!"

    # Join Ride
    requests.post(f"{BASE_URL}/rides/{trip_id}/join", json={}, headers=h_p2).raise_for_status()
    bal_p2 = get_balance(h_p2)
    print(f"P2 (Joiner) balance after joining: {bal_p2}")
    assert bal_p2 == Decimal("1000.00"), "Money should NOT be deducted at joining!"

    # 4. Acceptance and Verification
    # Driver bids $330 (slightly higher than target $300)
    requests.post(f"{BASE_URL}/bids/{trip_id}", json={"amount": 330.0}, headers=h_driver).raise_for_status()
    bids = requests.get(f"{BASE_URL}/bids/{trip_id}/all", headers=h_p1).json()
    bid_id = bids[0]["id"]
    
    # Accept Bid
    requests.post(f"{BASE_URL}/bids/{bid_id}/accept", headers=h_p1).raise_for_status()
    print("Bid accepted ($330 for 2 passengers). Expected split: $165 each.")
    
    # Still no deduction
    assert get_balance(h_p1) == Decimal("1000.00")
    assert get_balance(h_p2) == Decimal("1000.00")

    # 5. Start and Complete Trip
    # Get trip details for OTP
    trip = requests.get(f"{BASE_URL}/rides/{trip_id}/details", headers=h_driver).json()
    start_otp = trip["start_otp"]
    
    # Verify OTP
    requests.post(f"{BASE_URL}/rides/{trip_id}/verify-otp", json={"otp": start_otp}, headers=h_driver).raise_for_status()
    
    # Get completion OTP
    trip = requests.get(f"{BASE_URL}/rides/driver-trips", headers=h_driver).json()[0]
    comp_otp = trip["completion_otp"]
    
    # Complete Trip -> THIS trigger DEDUCTION
    requests.post(f"{BASE_URL}/rides/{trip_id}/complete", json={"otp": comp_otp}, headers=h_driver).raise_for_status()
    print("Trip completed! Finalizing balances...")
    
    bal_p1_final = get_balance(h_p1)
    bal_p2_final = get_balance(h_p2)
    bal_driver_final = get_balance(h_driver)
    
    print(f"P1 Final: {bal_p1_final}")
    print(f"P2 Final: {bal_p2_final}")
    print(f"Driver Final: {bal_driver_final}")
    
    assert bal_p1_final == Decimal("1000.00") - Decimal("165.00")
    assert bal_p2_final == Decimal("1000.00") - Decimal("165.00")
    assert bal_driver_final == Decimal("1000.00") + Decimal("330.00")

    print("\n--- All Hardened Feature Tests PASSED! ---")

if __name__ == "__main__":
    try:
        test_hardened_features()
    except Exception as e:
        print(f"Test FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
