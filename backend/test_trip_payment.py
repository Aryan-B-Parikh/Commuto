import requests
import uuid
import os
import hmac
import hashlib
from datetime import datetime, timedelta

API_URL = "http://localhost:8000"

def test_trip_payment():
    print("Testing Direct Trip Payment Flow...")

    # 1. Register/Login Driver
    driver_data = {
        "email": f"driver_{uuid.uuid4().hex[:6]}@example.com",
        "password": "password123",
        "full_name": "Test Driver",
        "phone": "9876543210",
        "role": "driver"
    }
    reg_res = requests.post(f"{API_URL}/auth/register", json=driver_data)
    if reg_res.status_code not in [200, 201]:
        print(f"Driver Registration Failed: {reg_res.text}")
    
    login_res = requests.post(f"{API_URL}/auth/login", json={"email": driver_data["email"], "password": driver_data["password"]})
    if login_res.status_code != 200:
        print(f"Driver Login Failed: {login_res.text}")
        return
    
    driver_token = login_res.json().get("access_token")
    if not driver_token:
        print(f"No driver token: {login_res.json()}")
        return

    driver_headers = {"Authorization": f"Bearer {driver_token}"}
    print("Driver logged in.")

    # 2. Register/Login Passenger
    passenger_data = {
        "email": f"passenger_{uuid.uuid4().hex[:6]}@example.com",
        "password": "password123",
        "full_name": "Test Passenger",
        "phone": "1234567890",
        "role": "passenger"
    }
    requests.post(f"{API_URL}/auth/register", json=passenger_data)
    login_res = requests.post(f"{API_URL}/auth/login", json={"email": passenger_data["email"], "password": passenger_data["password"]})
    if login_res.status_code != 200:
        print(f"Passenger Login Failed: {login_res.text}")
        return
    
    passenger_token = login_res.json().get("access_token")
    if not passenger_token:
        print(f"No passenger token: {login_res.json()}")
        return

    passenger_headers = {"Authorization": f"Bearer {passenger_token}"}
    print("Passenger logged in.")

    # 3. Create a Trip (as passenger or driver - usually driver for shared)
    trip_data = {
        "from_location": {"address": "Origin A", "lat": 12.9716, "lng": 77.5946},
        "to_location": {"address": "Dest B", "lat": 12.2958, "lng": 76.6394},
        "date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
        "time": "10:00",
        "total_seats": 4,
        "price_per_seat": 500.0
    }
    trip_res = requests.post(f"{API_URL}/rides/create-shared", json=trip_data, headers=passenger_headers)
    trip = trip_res.json()
    trip_id = trip["id"]
    print(f"Trip created: {trip_id}")

    # 4. Driver bids/joins (for shared it's simplified here, let's just make it a driver trip if possible)
    # Actually, let's assume the trip has a driver.
    # In shared commute, a passenger creates it, then a driver can join.
    # For this test, let's just use the join endpoint.
    join_res = requests.post(f"{API_URL}/rides/{trip_id}/join", headers=passenger_headers)
    booking_id = join_res.json().get("booking_id")
    print(f"Passenger joined/booked. Booking ID: {booking_id}")
    
    # Need to ensure trip has a driver_id for the credit to work
    # We can't easily force driver_id via API without bidding flow.
    # Let's check the booking status first.
    details = requests.get(f"{API_URL}/rides/{trip_id}/details", headers=passenger_headers).json()
    booking_id = details.get("user_booking", {}).get("id")
    print(f"Confirmed Booking ID from details: {booking_id}")

    # 5. Create Payment Order
    order_res = requests.post(f"{API_URL}/rides/{trip_id}/pay-order", params={"booking_id": booking_id}, headers=passenger_headers)
    if order_res.status_code != 200:
        print(f"Failed to create order: {order_res.text}")
        return
    order = order_res.json()
    print(f"Payment Order Created: {order['order_id']}")

    # 6. Verify Payment (Simulate Razorpay callback)
    # Use the secret from .env to sign
    key_secret = "X2Tnz72eYscHyhLXx2nvj669"
    
    # Generate signature matching the backend logic
    razorpay_payment_id = f"pay_{uuid.uuid4().hex[:14]}"
    message = f"{order['order_id']}|{razorpay_payment_id}"
    signature = hmac.new(
        key_secret.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    verify_data = {
        "trip_id": trip_id,
        "booking_id": booking_id,
        "razorpay_order_id": order["order_id"],
        "razorpay_payment_id": razorpay_payment_id,
        "razorpay_signature": signature
    }
    
    verify_res = requests.post(f"{API_URL}/rides/verify-trip-payment", json=verify_data, headers=passenger_headers)
    print(f"Verification Result: {verify_res.json()}")

    # 7. Check Booking Status
    details = requests.get(f"{API_URL}/rides/{trip_id}/details", headers=passenger_headers).json()
    print(f"Final Booking Payment Status: {details.get('user_booking', {}).get('payment_status')}")
    
    if details.get('user_booking', {}).get('payment_status') == "completed":
        print("Success: Payment marked as completed!")
    else:
        print("Failure: Payment status not updated.")

if __name__ == "__main__":
    test_trip_payment()
