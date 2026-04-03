import requests
import uuid
import time
import string
import random

BASE_URL = "http://127.0.0.1:8000"

def get_random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def run_test():
    print("Starting Bidirectional Bidding Flow Test...")
    
    # 1. Create Driver User
    driver_data = {
        "email": f"driver_{get_random_string()}@test.com",
        "full_name": f"Driver {get_random_string()}",
        "password": "Password123!",
        "role": "driver",
        "phone": f"+1555{random.randint(1000000, 9999999)}"
    }
    print(f"1. Registering Driver: {driver_data['email']}")
    r = requests.post(f"{BASE_URL}/auth/register", json=driver_data)
    if r.status_code not in [200, 201]:
        print(r.text)
        return
    
    # Login Driver
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": driver_data['email'], "password": driver_data['password']})
    if r.status_code not in [200, 201]:
        print(r.text)
        return
    driver_token = r.json()["access_token"]
    driver_headers = {"Authorization": f"Bearer {driver_token}"}
    
    # 2. Create Passenger User
    passenger_data = {
        "email": f"pass_{get_random_string()}@test.com",
        "full_name": f"Passenger {get_random_string()}",
        "password": "Password123!",
        "role": "passenger",
        "phone": f"+1555{random.randint(1000000, 9999999)}"
    }
    print(f"2. Registering Passenger: {passenger_data['email']}")
    r = requests.post(f"{BASE_URL}/auth/register", json=passenger_data)
    if r.status_code not in [200, 201]:
        print("Passenger register error:", r.text)
        return
    
    # Login Passenger
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": passenger_data['email'], "password": passenger_data['password']})
    if r.status_code not in [200, 201]:
        print("Passenger login error:", r.text)
        return
    pass_token = r.json()["access_token"]
    pass_headers = {"Authorization": f"Bearer {pass_token}"}
    
    # 3. Passenger Creates a Trip
    print("3. Passenger creates a shared trip...")
    trip_data = {
        "from_location": {
            "address": "Test Origin",
            "lat": 40.7128,
            "lng": -74.0060,
        },
        "to_location": {
            "address": "Test Dest",
            "lat": 40.7580,
            "lng": -73.9855,
        },
        "date": "2026-05-01",
        "time": "12:00",
        "total_seats": 4,
        "price_per_seat": 50
    }
    r = requests.post(f"{BASE_URL}/rides/create-shared", json=trip_data, headers=pass_headers)
    if r.status_code not in [200, 201]:
        print("Passenger trip create error:", r.text)
        return
    trip_id = r.json()["id"]
    print(f"   Trip created! ID: {trip_id}")
    
    # 4. Driver bids on the trip
    print("4. Driver places a bid of 50...")
    r = requests.post(f"{BASE_URL}/bids/{trip_id}", json={"amount": 50}, headers=driver_headers)
    r.raise_for_status()
    driver_bid_id = r.json()["id"]
    print(f"   Driver bid placed! ID: {driver_bid_id}")
    
    # 5. Passenger counters the bid
    print("5. Passenger counters the bid with 40...")
    r = requests.post(f"{BASE_URL}/bids/{driver_bid_id}/counter", json={"amount": 40}, headers=pass_headers)
    
    if r.status_code != 200:
        print("   ERROR: Passenger counter failed:", r.text)
        return
        
    pass_counter_bid_id = r.json()["id"]
    print(f"   Passenger counter bid placed! New Bid ID: {pass_counter_bid_id}")
    
    # 6. Driver counters the passenger's counter bid
    print("6. Driver counters the passenger's counter bid with 45...")
    r = requests.post(f"{BASE_URL}/bids/{pass_counter_bid_id}/counter", json={"amount": 45}, headers=driver_headers)
    if r.status_code != 200:
        print("   ERROR: Driver counter failed:", r.text)
        return
        
    driver_counter_bid_id = r.json()["id"]
    print(f"   Driver counter bid placed! New Bid ID: {driver_counter_bid_id}")
    
    # 7. Passenger accepts the driver's final counter bid
    print("7. Passenger accepts the final counter bid of 45...")
    r = requests.post(f"{BASE_URL}/bids/{driver_counter_bid_id}/accept", headers=pass_headers)
    if r.status_code != 200:
        print("   ERROR: Passenger accept failed:", r.text)
        return
        
    print("   Bid accepted successfully!")
    print("\n✅ Bidirectional flow test completed SUCCESSFULLY!")

if __name__ == "__main__":
    run_test()
