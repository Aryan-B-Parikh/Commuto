from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from ride_states import normalize_ride_status

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
    
    model_config = ConfigDict(from_attributes=True)


# Trip Schemas
class SharedTripCreate(BaseModel):
    from_location: LocationCreate
    to_location: LocationCreate
    date: str
    time: str
    total_seats: int = Field(ge=1, le=4)
    total_price: float = Field(gt=0)
    payment_method: str = Field(default="online", pattern="^(online|cash)$")
    notes: Optional[str] = Field(default=None, max_length=500)


class PassengerNote(BaseModel):
    passenger_name: str
    notes: str

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
    total_price: Optional[float] = None
    price_per_seat: Optional[float] = None
    status: str
    notes: Optional[str] = None
    start_otp: Optional[str] = None
    completion_otp: Optional[str] = None
    otp_verified: bool = False
    created_at: datetime
    
    # Driver Details
    driver_name: Optional[str] = None
    driver_rating: Optional[float] = None
    driver_avatar: Optional[str] = None
    bid_count: int = 0
    
    # User's booking info (if applicable)
    booking_id: Optional[str] = None
    booking_total_price: Optional[float] = None
    booking_payment_status: Optional[str] = None
    payment_method: Optional[str] = None
    
    # All passenger notes for this trip
    passenger_notes: List[PassengerNote] = []

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, value):
        return normalize_ride_status(value)
    
    model_config = ConfigDict(from_attributes=True)


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
    message: Optional[str] = Field(default=None, max_length=500)


class BidResponse(BaseModel):
    id: UUID
    trip_id: UUID
    driver_id: UUID
    bid_amount: float
    status: str
    message: Optional[str] = None
    created_at: datetime
    is_counter_bid: Optional[bool] = False
    parent_bid_id: Optional[UUID] = None
    
    model_config = ConfigDict(from_attributes=True)


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
    total_price: Optional[float] = None
    price_per_seat: Optional[float] = None
    notes: Optional[str] = None
    passenger_notes: List[PassengerNote] = []

    @field_validator("trip_status", mode="before")
    @classmethod
    def normalize_trip_status(cls, value):
        return normalize_ride_status(value)


class BidWithDriver(BaseModel):
    id: UUID
    trip_id: UUID
    driver_id: UUID
    bid_amount: float
    status: str
    message: Optional[str] = None
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
    completion_otp: str


class TripCompleteResponse(BaseModel):
    message: str
    trip_id: str
    completed_at: datetime

class PassengerShortInfo(BaseModel):
    id: UUID
    full_name: str
    avatar_url: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class BookingShortInfo(BaseModel):
    id: UUID
    payment_status: str

    model_config = ConfigDict(from_attributes=True)

class TripWithPassengers(TripResponse):
    passengers: List[PassengerShortInfo] = []
    creator: Optional[PassengerShortInfo] = None
    user_booking: Optional[BookingShortInfo] = None
