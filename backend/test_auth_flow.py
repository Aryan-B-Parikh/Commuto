import urllib.request
import json
import urllib.error

BASE_URL = "http://localhost:8000"
EMAIL = "test_dafe4562@example.com"
PASSWORD = "password123"

def login():
    url = f"{BASE_URL}/auth/login"
    data = {"email": EMAIL, "password": PASSWORD}
    json_data = json.dumps(data).encode("utf-8")
    
    req = urllib.request.Request(
        url, 
        data=json_data, 
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                body = json.loads(response.read().decode())
                print(f"Login Success. Token prefix: {body['access_token'][:10]}...")
                return body["access_token"]
            else:
                print(f"Login Failed with status: {response.status}")
                return None
    except urllib.error.HTTPError as e:
        print(f"Login Error: {e.code} - {e.read().decode()}")
        return None
    except Exception as e:
        print(f"Login Connection Error: {e}")
        return None

def get_me(token):
    url = f"{BASE_URL}/auth/me"
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                body = json.loads(response.read().decode())
                print("Get Me Success!")
                # Print keys to verify schema match
                print(f"Response keys: {list(body.keys())}")
                return True
            else:
                print(f"Get Me Failed with status: {response.status}")
                return False
    except urllib.error.HTTPError as e:
        print(f"Get Me Error: {e.code} - {e.read().decode()}")
        return False
    except Exception as e:
        print(f"Get Me Connection Error: {e}")
        return False

if __name__ == "__main__":
    print("Testing Auth Flow...")
    token = login()
    if token:
        get_me(token)
