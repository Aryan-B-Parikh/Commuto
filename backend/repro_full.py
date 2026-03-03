import requests
import uuid

BASE = "http://127.0.0.1:8000"

def get_token(email, password):
    r = requests.post(f"{BASE}/auth/login", json={"email": email, "password": password})
    if r.status_code == 200:
        return r.json()["access_token"]
    return None

def test_error(ride_id, amount, token):
    print(f"Testing place_bid with amount={amount} for ride {ride_id}...")
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        r = requests.post(f"{BASE}/bids/{ride_id}", json={"amount": amount}, headers=headers)
        print(f"Status: {r.status_code}")
        try:
            print(f"Body: {r.json()}")
        except:
            print(f"Body: {r.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Register a test driver
    uid = str(uuid.uuid4())[:8]
    email = f"repro_{uid}@test.com"
    print(f"Registering driver {email}...")
    requests.post(f"{BASE}/auth/register", json={
        "email": email, "password": "testpass123", "full_name": "Repro D",
        "phone": "0000000000", "role": "driver",
        "license_number": "DL123", "vehicle_make": "Toyota",
        "vehicle_model": "Camry", "vehicle_plate": "MH01AB1234", "vehicle_capacity": 4
    })
    
    token = get_token(email, "testpass123")
    if not token:
        print("Failed to get token")
        exit(1)
        
    ride_id = str(uuid.uuid4())
    # This should be a 422 if amount is not a number
    test_error(ride_id, "invalid_amount", token)
    # This should be a 422 if ride_id is not a UUID
    test_error("not-a-uuid", 50, token)
    # Register a test passenger to test 403
    pe = f"repro_p_{uid}@test.com"
    requests.post(f"{BASE}/auth/register", json={
        "email": pe, "password": "testpass123", "full_name": "Repro P",
        "phone": "1111111111", "role": "passenger"
    })
    p_token = get_token(pe, "testpass123")
    
    # Create a trip to bid on
    print("Creating trip...")
    rt = requests.post(f"{BASE}/rides/create-shared", headers=p_token_headers if 'p_token_headers' in locals() else {"Authorization": f"Bearer {p_token}"}, json={
        "from_location": {"address": "A", "lat": 10, "lng": 10},
        "to_location": {"address": "B", "lat": 11, "lng": 11},
        "date": "2026-03-01", "time": "10:00", "total_seats": 4, "price_per_seat": 50
    })
    if rt.status_code == 201:
        tid = rt.json()["id"]
        print(f"Trip created: {tid}")
        # This should be a 201
        test_error(tid, 75, token)
    else:
        print(f"Failed to create trip: {rt.text}")
