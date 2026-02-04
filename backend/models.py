from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Enum, Text, Numeric, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum
import uuid

# Enums
class UserRole(str, enum.Enum):
    PASSENGER = "passenger"
    DRIVER = "driver"

class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer-not-to-say"

class TripStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class BidStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"

# Base User Model
class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone_number = Column(String(20))  # Changed from 'phone'
    full_name = Column(String(255), nullable=False)
    avatar_url = Column(Text)  # Changed from 'avatar'
    hashed_password = Column(Text, nullable=False)  # Changed from 'password_hash'
    role = Column(String(20), nullable=False)  # Added role field
    is_verified = Column(Boolean, default=False)
    is_phone_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    driver_profile = relationship("Driver", back_populates="user", uselist=False)
    passenger_profile = relationship("Passenger", back_populates="user", uselist=False)
    saved_places = relationship("SavedPlace", back_populates="user")
    bookings = relationship("Booking", back_populates="passenger", foreign_keys="Booking.passenger_id")

# Driver Model
class Driver(Base):
    __tablename__ = "drivers"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    license_number = Column(String(50), nullable=True)
    license_url = Column(Text, nullable=True)
    insurance_expiry = Column(Date, nullable=True)
    rating = Column(Numeric(3, 2), nullable=True)
    total_trips = Column(Integer, default=0)
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="driver_profile")
    vehicles = relationship("Vehicle", back_populates="driver")
    trips = relationship("Trip", back_populates="driver", foreign_keys="Trip.driver_id")
    bids = relationship("TripBid", back_populates="driver")

# Passenger Model
class Passenger(Base):
    __tablename__ = "passengers"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    preferences = Column(JSONB, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="passenger_profile")

# Vehicle Model
class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.user_id"), nullable=True)
    make = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    year = Column(Integer, nullable=True)
    plate_number = Column(String(50), nullable=False)
    capacity = Column(Integer, nullable=False)
    color = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    driver = relationship("Driver", back_populates="vehicles")
    trips = relationship("Trip", back_populates="vehicle")

# Trip Model
class Trip(Base):
    __tablename__ = "trips"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.user_id"), nullable=True)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=True)
    
    origin_address = Column(Text, nullable=False)
    origin_lat = Column(Numeric, nullable=False)
    origin_lng = Column(Numeric, nullable=False)
    
    dest_address = Column(Text, nullable=False)
    dest_lat = Column(Numeric, nullable=False)
    dest_lng = Column(Numeric, nullable=False)
    
    start_time = Column(DateTime, nullable=False)
    status = Column(String(20), default="pending")
    price_per_seat = Column(Numeric, nullable=False)
    total_seats = Column(Integer, nullable=False)
    available_seats = Column(Integer, nullable=False)
    
    start_otp = Column(String(6), nullable=True)
    otp_verified = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    driver = relationship("Driver", back_populates="trips", foreign_keys=[driver_id])
    vehicle = relationship("Vehicle", back_populates="trips")
    bookings = relationship("Booking", back_populates="trip", cascade="all, delete-orphan")
    bids = relationship("TripBid", back_populates="trip", cascade="all, delete-orphan")
    locations = relationship("TripLocation", back_populates="trip", cascade="all, delete-orphan")

# Booking Model
class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=True)
    passenger_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    seats_booked = Column(Integer, nullable=True)
    total_price = Column(Numeric, nullable=False)
    status = Column(String(20), default="pending")
    payment_status = Column(String(20), default="pending")
    otp_verified = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    trip = relationship("Trip", back_populates="bookings")
    passenger = relationship("User", back_populates="bookings", foreign_keys=[passenger_id])

# TripBid Model
class TripBid(Base):
    __tablename__ = "trip_bids"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=True)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.user_id"), nullable=True)
    
    bid_amount = Column(Numeric, nullable=False)
    status = Column(String(20), default="pending")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    trip = relationship("Trip", back_populates="bids")
    driver = relationship("Driver", back_populates="bids")

# SavedPlace Model
class SavedPlace(Base):
    __tablename__ = "saved_places"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    name = Column(String(100), nullable=False)
    address = Column(Text, nullable=False)
    latitude = Column(Numeric, nullable=True)
    longitude = Column(Numeric, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="saved_places")

# TripLocation Model (for real-time tracking)
class TripLocation(Base):
    __tablename__ = "trip_locations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=True)
    
    latitude = Column(Numeric, nullable=False)
    longitude = Column(Numeric, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    trip = relationship("Trip", back_populates="locations")
