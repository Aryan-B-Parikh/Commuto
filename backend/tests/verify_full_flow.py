import sys
import os
import uuid
import json
import requests
from decimal import Decimal
from datetime import datetime, timedelta

# Add parent dir to path if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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
    subprocess.run(["venv\\Scripts\\python.exe", "-c", py_code], check=True)

def test_pricing_flow():
    print("--- Starting Pricing Flow Verification ---")
    
    # 1. Setup Users
    u1_email = f"creator_{uuid.uuid4().hex[:6]}@example.com"
    u2_email = f"joiner_{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"
    
    for email, name in [(u1_email, "Creator"), (u2_email, "Joiner")]:
        requests.post(f"{BASE_URL}/auth/register", json={
            "email": email, "password": password, "full_name": name, "phone": "1234567890", "role": "passenger"
        }).raise_for_status()
        
        # Complete profile
        token = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password}).json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        requests.patch(f"{BASE_URL}/auth/me", json={
            "gender": "male", "date_of_birth": "1990-01-01", 
            "emergency_contact": {"name": "EC", "phone": "000", "relationship": "Test"},
            "full_name": name,
            "phone_number": "1234567890"
        }, headers=headers).raise_for_status()
        
        # Add initial funds
        add_funds_manually(email, 1000)
    
    t1 = requests.post(f"{BASE_URL}/auth/login", json={"email": u1_email, "password": password}).json()["access_token"]
    t2 = requests.post(f"{BASE_URL}/auth/login", json={"email": u2_email, "password": password}).json()["access_token"]
    h1 = {"Authorization": f"Bearer {t1}"}
    h2 = {"Authorization": f"Bearer {t2}"}

    initial_bal = Decimal("1000.00")
    assert get_balance(h1) == initial_bal
    assert get_balance(h2) == initial_bal
    
    # 2. Create Ride ($200)
    print("Step: Creating ride for $200...")
    ride_data = {
        "from_location": {"address": "A", "lat": 0, "lng": 0},
        "to_location": {"address": "B", "lat": 1, "lng": 1},
        "date": (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d"),
        "time": "12:00",
        "total_seats": 4,
        "total_price": 200.0
    }
    r = requests.post(f"{BASE_URL}/rides/create-shared", json=ride_data, headers=h1)
    r.raise_for_status()
    trip_id = r.json()["id"]
    
    # Check Creator Balance: 1000 - 200 = 800
    bal1 = get_balance(h1)
    print(f"Creator balance after creation: {bal1}")
    assert bal1 == Decimal("800.00")
    
    # 3. Join Ride
    print("Step: Second passenger joining...")
    requests.post(f"{BASE_URL}/rides/{trip_id}/join", json={}, headers=h2).raise_for_status()
    
    # Check Balances:
    # Creator: 800 + 100 (refund) = 900
    # Joiner: 1000 - 100 (charge) = 900
    bal1 = get_balance(h1)
    bal2 = get_balance(h2)
    print(f"Creator balance after join: {bal1}")
    print(f"Joiner balance after join: {bal2}")
    
    assert bal1 == Decimal("900.00")
    assert bal2 == Decimal("900.00")
    
    print("--- Pricing Flow Verification SUCCESS ---")

if __name__ == "__main__":
    try:
        test_pricing_flow()
    except Exception as e:
        print(f"Test FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
