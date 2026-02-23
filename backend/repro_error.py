import requests
import uuid

BASE = "http://127.0.0.1:8000"

def test_error(ride_id, amount):
    print(f"Testing place_bid with amount={amount} for ride {ride_id}...")
    try:
        # We don't have a token here, so it should return 401
        r = requests.post(f"{BASE}/bids/{ride_id}", json={"amount": amount})
        print(f"Status: {r.status_code}")
        try:
            print(f"Body: {r.json()}")
        except:
            print(f"Body: {r.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    ride_id = str(uuid.uuid4())
    test_error(ride_id, 50)
    test_error(ride_id, -1)
    test_error("not-a-uuid", 50)
    test_error(ride_id, "abc")
