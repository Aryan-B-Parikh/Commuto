from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
import models
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def hash_password(password: str) -> str:
    # bcrypt has a 72 byte limit
    if len(password.encode('utf-8')) > 72:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is too long (maximum 72 bytes)"
        )
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user

def get_user_roles(user: models.User, db: Session) -> list[str]:
    """Determine all roles for a user based on profiles and base role field"""
    roles = []
    
    # Check base role field first
    if user.role:
        roles.append(user.role)
    
    # Check if user has driver profile
    driver = db.query(models.Driver).filter(models.Driver.user_id == user.id).first()
    if driver and "driver" not in roles:
        roles.append("driver")
    
    # Check if user has passenger profile
    passenger = db.query(models.Passenger).filter(models.Passenger.user_id == user.id).first()
    if passenger and "passenger" not in roles:
        roles.append("passenger")
    
    return roles if roles else ["unknown"]

def get_user_role(user: models.User, db: Session) -> str:
    """Return a single primary role for a user"""
    roles = get_user_roles(user, db)
    return roles[0] if roles else "unknown"

def require_role(allowed_roles: list):
    def role_checker(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
        user_roles = get_user_roles(current_user, db)
        # Check if any of the user's roles are in the allowed roles list
        if not any(role in allowed_roles for role in user_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You don't have permission to access this resource. Roles found: {', '.join(user_roles)}"
            )
        return current_user
    return role_checker
