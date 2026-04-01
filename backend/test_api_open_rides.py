import sys
import os
sys.path.append('d:/Commuto/backend')
from database import SessionLocal
import models
import auth
from fastapi.testclient import TestClient
from main import app

db = SessionLocal()

# Get the driver
driver = db.query(models.User).filter(models.User.email == "khpatel1719@gmail.com").first()
print(f"Driver ID: {driver.id}")

# Create an access token for him
access_token = auth.create_access_token(data={"sub": str(driver.id), "role": "driver"})

client = TestClient(app)

response = client.get(
    "/rides/open",
    headers={"Authorization": f"Bearer {access_token}"}
)

if response.status_code == 200:
    rides = response.json()
    print(f"API Returned {len(rides)} open rides for {driver.email}.")
    for r in rides:
        print(f" - Ride ID: {r['id']}, Creator: {r.get('creator_passenger_id', 'Unknown')}")
else:
    print(f"Error {response.status_code}: {response.text}")

db.close()
