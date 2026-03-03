import requests

try:
    response = requests.post("http://localhost:8000/auth/login", json={"email": "test@example.com", "password": "password123"})
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
