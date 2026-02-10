import urllib.request
import json
import urllib.error
import random
import string

BASE_URL = "http://localhost:8000"

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

def test_backend():
    print("Starting Backend Verification Suite...\n")

    # 1. Health Check
    print("1. Testing Health Check (/health)...")
    res = run_request("GET", "/health")
    if res["status"] == 200:
        print("Health Check Passed")
    else:
        print(f"Health Check Failed: {res}")
        return

    # 2. Registration
    print("\n2. Testing Registration (/auth/register)...")
    email = f"user_{generate_random_string()}@test.com"
    password = "password123"
    payload = {
        "email": email,
        "password": password,
        "full_name": "Test User",
        "phone": "1234567890", # Using 'phone' as per frontend mapping
        "role": "passenger"
    }
    # Note: Backend schema expects 'phone' in Request, maps to 'phone_number' in DB/Response
    
    res = run_request("POST", "/auth/register", payload)
    if res["status"] == 201:
        print(f"Registration Passed for {email}")
    else:
        print(f"Registration Failed: {res}")
        return

    # 3. Login
    print("\n3. Testing Login (/auth/login)...")
    login_payload = {"email": email, "password": password}
    res = run_request("POST", "/auth/login", login_payload)
    
    token = None
    if res["status"] == 200 and "access_token" in res["body"]:
        token = res["body"]["access_token"]
        print("Login Passed")
    else:
        print(f"Login Failed: {res}")
        return

    # 4. Get Current User (Auth/Me)
    print("\n4. Testing Get Current User (/auth/me)...")
    res = run_request("GET", "/auth/me", token=token)
    if res["status"] == 200:
        print("Get Current User Passed")
        print(f"   Response keys: {list(res['body'].keys())}")
    else:
        print(f"Get Current User Failed: {res}")
        return

    print("\nAll Backend Tests Passed!")

if __name__ == "__main__":
    test_backend()
