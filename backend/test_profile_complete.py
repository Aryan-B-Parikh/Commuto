import sys
import os
sys.path.append('D:\\Commuto\\backend')

from database import SessionLocal
import models
from routers.auth_router import _check_profile_complete
from sqlalchemy.orm import Session
import json

db: Session = SessionLocal()

# Find the newest user to test
user = db.query(models.User).order_by(models.User.created_at.desc()).first()
print(f"Testing user: {user.email}")
print(f"Current profile_completed: {user.profile_completed}")

# Let's see what they have
print(f"gender: {user.gender}")
print(f"dob: {user.date_of_birth}")
print(f"name: {user.full_name}")
print(f"phone: {user.phone_number}")
print(f"emergency: {user.emergency_contact}")

print(f"Check Profile Complete result: {_check_profile_complete(user, db)}")
