from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# Trip Schemas
class LocationCreate(BaseModel):
    address: str
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)

class TripCreate(BaseModel):
    from_location: LocationCreate
    to_location: LocationCreate
    date: str
    time: str
    seats_requested: int = Field(ge=1, le=4)

class TripResponse(BaseModel):
    id: str
    passenger_id: str
    driver_id: Optional[str] = None
    from_address: str
    to_address: str
    date: str
    time: str
    seats_requested: int
    price_per_seat: Optional[float] = None
    status: str
    distance: Optional[str] = None
    duration: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Bid Schemas
class BidCreate(BaseModel):
    amount: float = Field(gt=0)
    message: Optional[str] = None

class BidResponse(BaseModel):
    id: str
    trip_id: str
    driver_id: str
    amount: float
    message: Optional[str] = None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class BidWithDriver(BidResponse):
    driver_name: str
    driver_rating: float
    driver_avatar: Optional[str] = None

# OTP Schema
class OTPVerify(BaseModel):
    otp: str = Field(min_length=6, max_length=6)
