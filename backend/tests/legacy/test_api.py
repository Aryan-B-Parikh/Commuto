import requests

try:
    response = requests.get("http://localhost:8000/")
    print(f"Root endpoint: {response.status_code}")
    print(f"Response: {response.json()}\n")
except Exception as e:
    print(f"Error testing root: {e}\n")

try:
    response = requests.get("http://localhost:8000/health")
    print(f"Health endpoint: {response.status_code}")
    print(f"Response: {response.json()}\n")
except Exception as e:
    print(f"Error testing health: {e}\n")

try:
    response = requests.get("http://localhost:8000/docs")
    print(f"Docs endpoint: {response.status_code}")
    print("API documentation is accessible!\n")
except Exception as e:
    print(f"Error testing docs: {e}\n")
