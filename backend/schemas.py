from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, date
from uuid import UUID

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    phone: str
    role: str  # "passenger" or "driver"
    
    # Optional driver fields
    license_number: Optional[str] = None
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_capacity: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str

    phone_number: str
    role: str  # Will be determined by presence of driver/passenger profile
    avatar_url: Optional[str] = None
    rating: Optional[float] = 0.0
    total_trips: Optional[int] = 0
    created_at: datetime
    
    # Driver-specific fields (optional)
    license_number: Optional[str] = None
    is_online: Optional[bool] = False
    
    class Config:
        from_attributes = True

class DriverResponse(BaseModel):
    user_id: UUID
    license_number: Optional[str]
    rating: Optional[float]
    total_trips: Optional[int]
    is_online: bool
    
    class Config:
        from_attributes = True

class VehicleResponse(BaseModel):
    id: UUID
    make: str
    model: str
    plate_number: str
    capacity: int
    color: Optional[str]
    
    class Config:
        from_attributes = True
