from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

# Location Schemas
class LocationCreate(BaseModel):
    address: str
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class LocationUpdate(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class LocationResponse(BaseModel):
    id: UUID
    trip_id: UUID
    latitude: float
    longitude: float
    timestamp: datetime
    
    class Config:
        from_attributes = True


# Trip Schemas
class TripCreate(BaseModel):
    from_location: LocationCreate
    to_location: LocationCreate
    date: str
    time: str
    seats_requested: int = Field(ge=1, le=4)


class TripResponse(BaseModel):
    id: UUID
    driver_id: Optional[UUID] = None
    from_address: str = Field(validation_alias="origin_address")
    to_address: str = Field(validation_alias="dest_address")
    start_time: datetime
    seats_requested: int = None  # For backward compatibility
    total_seats: int
    available_seats: int
    price_per_seat: Optional[float] = None
    status: str
    created_at: datetime
    
    # Driver Details
    driver_name: Optional[str] = None
    driver_rating: Optional[float] = None
    driver_avatar: Optional[str] = None
    
    class Config:
        from_attributes = True


class TripCancellationRequest(BaseModel):
    reason: Optional[str] = None


class TripCancellationResponse(BaseModel):
    message: str
    trip_id: str
    penalty_amount: float
    reason: Optional[str] = None


# Bid Schemas
class BidCreate(BaseModel):
    amount: float = Field(gt=0)
    message: Optional[str] = None


class BidResponse(BaseModel):
    id: UUID
    trip_id: UUID
    driver_id: UUID
    bid_amount: float
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class BidWithDriver(BaseModel):
    id: UUID
    trip_id: UUID
    driver_id: UUID
    bid_amount: float
    status: str
    created_at: datetime
    driver_name: str
    driver_rating: Optional[float]
    driver_avatar: Optional[str] = None


class BidAcceptResponse(BaseModel):
    message: str
    trip_id: str
    otp: str


# OTP Schema
class OTPVerify(BaseModel):
    otp: str = Field(min_length=6, max_length=6)


class OTPVerifyResponse(BaseModel):
    message: str
    trip_id: str
    started_at: datetime


class TripCompleteResponse(BaseModel):
    message: str
    trip_id: str
    completed_at: datetime
