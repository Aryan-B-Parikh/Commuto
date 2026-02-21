import requests
import json
import uuid
import time

BASE_URL = "http://127.0.0.1:8000"

def verify_full_flow():
    print("--- Verifying Full Ride Flow: Passenger & Driver ---")
    
    # 1. Register & Login Passenger
    p_email = f"p_{uuid.uuid4().hex[:6]}@example.com"
    p_data = {"email": p_email, "password": "Password123!", "full_name": "Test Passenger", "phone": "9876543210", "role": "passenger"}
    requests.post(f"{BASE_URL}/auth/register", json=p_data)
    p_token = requests.post(f"{BASE_URL}/auth/login", json={"email": p_email, "password": "Password123!"}).json()["access_token"]
    p_headers = {"Authorization": f"Bearer {p_token}"}
    
    # 2. Passenger Creates Ride
    ride_data = {
        "from_location": {"address": "Station", "lat": 23.0225, "lng": 72.5714},
        "to_location": {"address": "IIM", "lat": 23.0311, "lng": 72.5375},
        "date": "2026-03-01", "time": "12:00", "seats_requested": 1
    }
    trip_id = requests.post(f"{BASE_URL}/rides/request", json=ride_data, headers=p_headers).json()["id"]
    print(f"Ride created by passenger. Trip ID: {trip_id}")
    
    # 3. Register & Login Driver
    d_email = f"d_{uuid.uuid4().hex[:6]}@example.com"
    d_data = {
        "email": d_email, "password": "Password123!", "full_name": "Test Driver", "phone": "9998887776", "role": "driver",
        "license_number": "DL12345", "vehicle_make": "Toyota", "vehicle_model": "Camry", "vehicle_plate": "GJ01-AA-1234", "vehicle_capacity": 4
    }
    requests.post(f"{BASE_URL}/auth/register", json=d_data)
    d_token = requests.post(f"{BASE_URL}/auth/login", json={"email": d_email, "password": "Password123!"}).json()["access_token"]
    d_headers = {"Authorization": f"Bearer {d_token}"}
    print(f"Driver registered and logged in: {d_email}")
    
    # 4. Driver Checks Open Rides
    open_rides = requests.get(f"{BASE_URL}/rides/open", headers=d_headers).json()
    found = any(r["id"] == trip_id for r in open_rides)
    print(f"Trip found in open rides: {found}")
    
    # 5. Driver Places Bid
    bid_resp = requests.post(f"{BASE_URL}/bids/{trip_id}", json={"amount": 450, "message": "I am nearby!"}, headers=d_headers)
    bid_id = bid_resp.json()["id"]
    print(f"Driver placed bid: {bid_id} for amount 450")
    
    # 6. Passenger Views Bids and Accepts
    p_bids = requests.get(f"{BASE_URL}/bids/{trip_id}/all", headers=p_headers).json()
    print(f"Passenger received {len(p_bids)} bids")
    
    accept_resp = requests.post(f"{BASE_URL}/bids/{bid_id}/accept", headers=p_headers)
    if accept_resp.status_code == 200:
        print("SUCCESS: Passenger accepted bid. Ride is now CONFIRMED.")
    else:
        print(f"FAILED to accept bid: {accept_resp.text}")
        return

    # 7. Final Verification of Trip Status
    final_trip = requests.get(f"{BASE_URL}/rides/my-trips", headers=p_headers).json()[0]
    print(f"Final Trip Status (Passenger View): {final_trip['status']}")
    
    d_trips = requests.get(f"{BASE_URL}/rides/driver-trips", headers=d_headers).json()
    if d_trips:
        print(f"Final Trip Status (Driver View): {d_trips[0]['status']}")
    else:
        print("Driver has no assigned trips yet!")

if __name__ == "__main__":
    verify_full_flow()
