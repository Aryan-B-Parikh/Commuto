import sys
import os
import requests
sys.path.append('d:/Commuto/backend')
from database import SessionLocal
import models
import auth

db = SessionLocal()
driver = db.query(models.User).filter(models.User.email == "khpatel1719@gmail.com").first()
access_token = auth.create_access_token(data={"sub": str(driver.id), "role": "driver"})

print(f"Testing live server :8000 with driver token...")
res = requests.get("http://localhost:8000/rides/open", headers={"Authorization": f"Bearer {access_token}"})
print(f"Status Code: {res.status_code}")
print(f"Response: {res.text[:500]}")

db.close()
