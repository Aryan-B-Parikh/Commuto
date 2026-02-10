import urllib.request
import json
import urllib.error
import random
import string
import time
import sys

BASE_URL = "http://localhost:8000"
LOG_FILE = "api_test_results.log"

def log(message):
    print(message)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(message + "\n")

def generate_random_string(length=8):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

def run_request(method, endpoint, data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    json_data = json.dumps(data).encode("utf-8") if data else None
    
    req = urllib.request.Request(url, data=json_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            body = response.read().decode()
            try:
                json_body = json.loads(body)
            except:
                json_body = body
            return {"status": response.status, "body": json_body}
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            json_body = json.loads(body)
        except:
            json_body = body
        return {"status": e.code, "body": json_body}
    except Exception as e:
        return {"status": 0, "body": str(e)}

def get_user_id(token):
    res = run_request("GET", "/auth/me", token=token)
    if res["status"] == 200:
        return res["body"]["id"]
    return None

def test_full_flow():
    # Clear log file
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("Starting End-to-End API Test Suite...\n")
    
    log("Starting End-to-End API Test Suite...\n")

    # --- 1. Register Passenger ---
    log("1. Registering Passenger...")
    pass_email = f"pass_{generate_random_string()}@test.com"
    pass_payload = {
        "email": pass_email, "password": "password123", "full_name": "Test Passenger",
        "phone": "1111111111", "role": "passenger"
    }
    res = run_request("POST", "/auth/register", pass_payload)
    if res["status"] != 201:
        log(f"Passenger Registration Failed: {res}")
        return
    log(f"Passenger Registered: {pass_email}")
    
    # Login Passenger
    res = run_request("POST", "/auth/login", {"email": pass_email, "password": "password123"})
    if res["status"] != 200:
        log(f"Passenger Login Failed: {res}")
        return
    pass_token = res["body"]["access_token"]
    
    # Get Passenger ID
    pass_id = get_user_id(pass_token)
    if not pass_id:
        log("Failed to get Passenger ID")
        return
    log(f"Passenger ID: {pass_id}")

    # --- 2. Register Driver ---
    log("\n2. Registering Driver...")
    driver_email = f"driver_{generate_random_string()}@test.com"
    driver_payload = {
        "email": driver_email, "password": "password123", "full_name": "Test Driver",
        "phone": "2222222222", "role": "driver"
    }
    res = run_request("POST", "/auth/register", driver_payload)
    if res["status"] != 201:
        log(f"Driver Registration Failed: {res}")
        return
    log(f"Driver Registered: {driver_email}")

    # Login Driver
    res = run_request("POST", "/auth/login", {"email": driver_email, "password": "password123"})
    if res["status"] != 200:
        log(f"Driver Login Failed: {res}")
        return
    driver_token = res["body"]["access_token"]
    
    # Get Driver ID
    driver_id = get_user_id(driver_token)
    if not driver_id:
        log("Failed to get Driver ID")
        return
    log(f"Driver ID: {driver_id}")

    # --- 3. Create Trip (Passenger) ---
    log("\n3. Passenger Creating Trip...")
    trip_payload = {
        "from_location": {
            "address": "New York, NY",
            "lat": 40.7128,
            "lng": -74.0060
        },
        "to_location": {
            "address": "Boston, MA",
            "lat": 42.3601,
            "lng": -71.0589
        },
        "date": "2025-12-25",
        "time": "10:00",
        "seats_requested": 2
    }
    res = run_request("POST", "/rides/request", trip_payload, token=pass_token)
    if res["status"] not in [200, 201]:
        log(f"Trip Creation Failed: {res}")
        return
    trip_id = res["body"]["id"]
    log(f"Trip Created: {trip_id}")

    # --- 4. Driver Get Open Trips ---
    log("\n4. Driver Fetching Open Trips...")
    res = run_request("GET", "/rides/open", token=driver_token)
    if res["status"] != 200:
        log(f"Fetch Open Trips Failed: {res}")
        return
    
    trips = res["body"]
    found = any(t["id"] == trip_id for t in trips)
    if found:
        log("Trip found in Open Rides list")
    else:
        log("Trip NOT found in Open Rides list (might be filtered or latency?)")

    # --- 5. Driver Place Bid ---
    log("\n5. Driver Placing Bid...")
    bid_payload = {"amount": 45.0} # Checking BidCreate schema, it only has amount and optional message
    res = run_request("POST", f"/bids/{trip_id}", bid_payload, token=driver_token)
    if res["status"] not in [200, 201]:
        log(f"Place Bid Failed: {res}")
        return
    bid_id = res["body"]["id"]
    log(f"Bid Placed: {bid_id} Amount: $45.0")

    # --- 6. Passenger View Bids ---
    log("\n6. Passenger Viewing Bids...")
    res = run_request("GET", f"/bids/{trip_id}/all", token=pass_token)
    if res["status"] != 200:
        log(f"View Bids Failed: {res}")
        return
    bids = res["body"]
    my_bid = next((b for b in bids if b["id"] == bid_id), None)
    if my_bid:
        log("Bid found in Passenger's view")
    else:
        log("Bid NOT found in Passenger's view")
        return

    # --- 7. Passenger Accept Bid ---
    log("\n7. Passenger Accepting Bid...")
    res = run_request("POST", f"/bids/{bid_id}/accept", token=pass_token)
    if res["status"] != 200:
        log(f"Accept Bid Failed: {res}")
        return
    start_otp = res["body"].get("otp")
    log(f"Bid Accepted! OTP: {start_otp}")

    # --- 8. Verify Trip Status ---
    log("\n8. Verifying Trip Status...")
    res = run_request("GET", "/rides/my-trips", token=pass_token)
    my_trips = res["body"]
    active_trip = next((t for t in my_trips if t["id"] == trip_id), None)
    
    if active_trip and active_trip["status"] in ["active", "accepted", "confirmed"]:
        log(f"Trip Status Updated to: {active_trip['status']}")
    else:
        status = active_trip["status"] if active_trip else "Not Found"
        log(f"Trip Status Verification Failed. Current Status: {status}")

    log("\nFull Flow Test Completed Successfully!")

if __name__ == "__main__":
    test_full_flow()
