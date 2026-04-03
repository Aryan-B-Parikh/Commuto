import requests
import uuid

def test_register():
    url = "http://127.0.0.1:8000/auth/register"
    unique_email = f"test_{uuid.uuid4().hex}@example.com"
    data = {
        "email": unique_email,
        "password": "password123",
        "full_name": "Test User",
        "phone": "1234567890",
        "role": "passenger"
    }
    
    print(f"Attempting to register with email: {unique_email}")
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")

if __name__ == "__main__":
    test_register()
