import requests
import json
import uuid

BASE_URL = "http://127.0.0.1:8000"

def verify_ride_request():
    print("--- Verifying Ride Request Creation ---")
    
    # 1. Register a test passenger
    email = f"test_pass_{uuid.uuid4().hex[:6]}@example.com"
    reg_data = {
        "email": email,
        "password": "Password123!",
        "full_name": "Test Passenger",
        "phone": "9876543210",
        "role": "passenger"
    }
    
    print(f"Registering passenger: {email}")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json=reg_data)
    if reg_resp.status_code not in [200, 201]:
        print(f"Registration failed: {reg_resp.status_code} - {reg_resp.text}")
        return
    
    # 2. Login to get token
    print("Logging in...")
    login_resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": "Password123!"
    })
    if login_resp.status_code != 200:
        print(f"Login failed: {login_resp.status_code} - {login_resp.text}")
        return
    
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Create Ride Request
    ride_data = {
        "from_location": {
            "address": "Ahmedabad Railway Station",
            "lat": 23.0225,
            "lng": 72.5714
        },
        "to_location": {
            "address": "IIM Ahmedabad",
            "lat": 23.0311,
            "lng": 72.5375
        },
        "date": "2026-03-01",
        "time": "10:00",
        "seats_requested": 1
    }
    
    print("Creating ride request...")
    ride_resp = requests.post(f"{BASE_URL}/rides/request", json=ride_data, headers=headers)
    
    if ride_resp.status_code == 201:
        print("SUCCESS: Ride request created successfully!")
        print(f"Trip ID: {ride_resp.json()['id']}")
    else:
        print(f"FAILED: Status Code {ride_resp.status_code}")
        try:
            print(f"Error Detail: {json.dumps(ride_resp.json(), indent=2)}")
        except:
            print(f"Error Body: {ride_resp.text}")

if __name__ == "__main__":
    verify_ride_request()
