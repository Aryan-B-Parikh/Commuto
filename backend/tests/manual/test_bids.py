import requests
import uuid
import sys

BASE = "http://localhost:8000"

def run():
    uid = str(uuid.uuid4())[:8]
    pe = f"tp_{uid}@test.com"
    de = f"td_{uid}@test.com"
    
    # 1. Register Passenger
    print(f"Registering passenger {pe}...")
    rp = requests.post(f"{BASE}/auth/register", json={
        "email": pe, "password": "testpass123", "full_name": "Test P",
        "phone": "9876543210", "role": "passenger"
    })
    if rp.status_code != 201:
        print(f"FAIL: Register passenger failed: {rp.text}")
        sys.exit(1)
    pt = requests.post(f"{BASE}/auth/login", json={"email": pe, "password": "testpass123"}).json()["access_token"]
    ph = {"Authorization": f"Bearer {pt}"}

    # 2. Register Driver
    print(f"Registering driver {de}...")
    rd = requests.post(f"{BASE}/auth/register", json={
        "email": de, "password": "testpass123", "full_name": "Test D",
        "phone": "9876543211", "role": "driver",
        "license_number": "DL123", "vehicle_make": "Toyota",
        "vehicle_model": "Camry", "vehicle_plate": "MH01AB1234", "vehicle_capacity": 4
    })
    if rd.status_code != 201:
        print(f"FAIL: Register driver failed: {rd.text}")
        sys.exit(1)
    dt = requests.post(f"{BASE}/auth/login", json={"email": de, "password": "testpass123"}).json()["access_token"]
    dh = {"Authorization": f"Bearer {dt}"}

    # 3. Create Trip
    print("Creating trip...")
    rt = requests.post(f"{BASE}/rides/request", headers=ph, json={
        "from_location": {"address": "A", "lat": 10, "lng": 10},
        "to_location": {"address": "B", "lat": 11, "lng": 11},
        "date": "2026-03-01", "time": "10:00", "seats_requested": 1
    })
    if rt.status_code != 201:
        print(f"FAIL: Create trip failed: {rt.text}")
        sys.exit(1)
    tid = rt.json()["id"]
    print(f"Trip created: {tid}")

    # 4. Place Bid (Target Test)
    print(f"Placing bid on trip {tid}...")
    # Using the CORRECTED endpoint: /bids/{tid}
    rb = requests.post(f"{BASE}/bids/{tid}", headers=dh, json={
        "amount": 50, "message": "I can verify this!"
    })
    
    if rb.status_code == 201:
        print(f"PASS: Bid placed successfully! Response: {rb.json()}")
        sys.exit(0)
    else:
        print(f"FAIL: Place bid failed with {rb.status_code}: {rb.text}")
        sys.exit(1)

if __name__ == "__main__":
    try:
        run()
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)
