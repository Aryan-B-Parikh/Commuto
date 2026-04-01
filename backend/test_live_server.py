import requests
import sys
import json

try:
    # 1. Login as khpatel1719@gmail.com to get a real token via HTTP
    login_res = requests.post("http://localhost:8000/auth/login", json={
        "email": "khpatel1719@gmail.com",
        "password": "password123" # assuming standard test password
    })
    
    if login_res.status_code != 200:
        print(f"Login failed: {login_res.status_code} {login_res.text}")
        
        # If password fails, try to fetch open rides with no token to just see if it returns 401 (server alive)
        r = requests.get("http://localhost:8000/rides/open")
        print(f"Unauth request: {r.status_code}")
        sys.exit(1)
        
    token = login_res.json()["access_token"]
    
    # 2. Fetch open rides
    res = requests.get("http://localhost:8000/rides/open", headers={"Authorization": f"Bearer {token}"})
    print(f"Status Code: {res.status_code}")
    if res.status_code == 200:
        rides = res.json()
        print(f"Returned {len(rides)} rides.")
        for r in rides:
             print(f" - {r['id']} by {r.get('creator_passenger_id')}")
    else:
        print(f"Error text: {res.text}")

except Exception as e:
    print(f"Exception connecting to localhost:8000 : {e}")
