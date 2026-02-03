from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    phone: str
    role: str  # "passenger" or "driver"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: str
    role: str
    avatar: Optional[str] = None
    rating: float = 0.0
    total_trips: int = 0
    verified: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True
