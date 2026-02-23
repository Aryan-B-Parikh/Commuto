from pydantic import BaseModel, Field
from typing import Optional, List
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
class SharedTripCreate(BaseModel):
    from_location: LocationCreate
    to_location: LocationCreate
    date: str
    time: str
    total_seats: int = Field(ge=1, le=8)
    price_per_seat: float = Field(gt=0)
    notes: Optional[str] = None


class TripResponse(BaseModel):
    id: UUID
    driver_id: Optional[UUID] = None
    creator_passenger_id: Optional[UUID] = None
    origin_address: str
    dest_address: str
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float
    from_address: Optional[str] = None  # backward compat
    to_address: Optional[str] = None    # backward compat
    start_time: datetime
    seats_requested: Optional[int] = None
    total_seats: int
    available_seats: int
    price_per_seat: Optional[float] = None
    status: str
    created_at: datetime
    
    # Driver Details
    driver_name: Optional[str] = None
    driver_rating: Optional[float] = None
    driver_avatar: Optional[str] = None
    bid_count: int = 0
    
    # User's booking info (if applicable)
    booking_total_price: Optional[float] = None
    booking_payment_status: Optional[str] = None
    
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
    is_counter_bid: Optional[bool] = False
    parent_bid_id: Optional[UUID] = None
    
    class Config:
        from_attributes = True


class DriverBidWithTrip(BaseModel):
    id: UUID
    trip_id: UUID
    driver_id: UUID
    bid_amount: float
    status: str
    created_at: datetime
    # Trip details
    origin_address: str
    dest_address: str
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float
    trip_status: str
    start_time: datetime
    total_seats: int
    price_per_seat: Optional[float] = None


class BidWithDriver(BaseModel):
    id: UUID
    trip_id: UUID
    driver_id: UUID
    bid_amount: float
    status: str
    created_at: datetime
    is_counter_bid: Optional[bool] = False
    parent_bid_id: Optional[UUID] = None
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

class PassengerShortInfo(BaseModel):
    id: UUID
    full_name: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class BookingShortInfo(BaseModel):
    id: UUID
    payment_status: str

    class Config:
        from_attributes = True

class TripWithPassengers(TripResponse):
    passengers: List[PassengerShortInfo] = []
    creator: Optional[PassengerShortInfo] = None
    user_booking: Optional[BookingShortInfo] = None
