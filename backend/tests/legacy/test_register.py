import urllib.request
import json
import uuid

# Generate random unique email
email = f"test_{uuid.uuid4().hex[:8]}@example.com"

url = "http://localhost:8000/auth/register"
payload = {
    "email": email,
    "password": "password123",
    "full_name": "Test User",
    "phone": "9876543210", 
    "role": "passenger"
}

print(f"Attempting to register: {email}")

try:
    req = urllib.request.Request(
        url, 
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as response:
        print(f"Status Code: {response.status}")
        print(f"Response: {response.read().decode('utf-8')}")
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code}")
    print(f"Reason: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
