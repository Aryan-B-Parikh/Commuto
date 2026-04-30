from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Enum, Text, Numeric, Date, JSON
from sqlalchemy.dialects.postgresql import UUID
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
    BID_ACCEPTED = "bid_accepted"
    DRIVER_ASSIGNED = "driver_assigned"
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
    phone_number = Column(String(20))
    full_name = Column(String(255), nullable=False)
    avatar_url = Column(Text)
    hashed_password = Column(Text, nullable=False)
    role = Column(String(20), nullable=False)
    is_verified = Column(Boolean, default=False)
    is_phone_verified = Column(Boolean, default=False)
    profile_completed = Column(Boolean, default=False)
    verification_token = Column(String(64), nullable=True, index=True)
    verification_token_expires = Column(DateTime, nullable=True)
    phone_otp = Column(String(6), nullable=True)
    phone_otp_expires = Column(DateTime, nullable=True)
    
    # Profile fields
    gender = Column(String(20), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    bio = Column(Text, nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact = Column(JSON, nullable=True)  # {name, relationship, phone}
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    driver_profile = relationship("Driver", back_populates="user", uselist=False)
    passenger_profile = relationship("Passenger", back_populates="user", uselist=False)
    saved_places = relationship("SavedPlace", back_populates="user")
    bookings = relationship("Booking", back_populates="passenger", foreign_keys="Booking.passenger_id")
    payment_methods = relationship("PaymentMethod", back_populates="user", cascade="all, delete-orphan")
    wallet = relationship("Wallet", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

# Notification Model
class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False)  # e.g., "new_ride", "new_bid", "ride_status", "trip_started"
    link = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="notifications")

# Driver Model
class Driver(Base):
    __tablename__ = "drivers"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    license_number = Column(String(50), nullable=True)
    license_url = Column(Text, nullable=True)
    license_photo_url = Column(Text, nullable=True)
    insurance_expiry = Column(Date, nullable=True)
    insurance_status = Column(String(20), default="pending")  # active, pending, expired
    rating = Column(Numeric(3, 2), nullable=True)
    total_trips = Column(Integer, default=0)
    rating_count = Column(Integer, default=0)
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime, nullable=True)
    max_passengers = Column(Integer, default=4)
    route_radius = Column(Integer, default=10)  # km
    
    # Relationships
    user = relationship("User", back_populates="driver_profile")
    vehicles = relationship("Vehicle", back_populates="driver")
    trips = relationship("Trip", back_populates="driver", foreign_keys="Trip.driver_id")
    bids = relationship("TripBid", back_populates="driver")

# Passenger Model
class Passenger(Base):
    __tablename__ = "passengers"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    preferences = Column(JSON, nullable=True)  # {travel_preferences: [], route_radius, max_passengers}
    accessibility_needs = Column(Boolean, default=False)
    
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
    creator_passenger_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    origin_address = Column(Text, nullable=False)
    origin_lat = Column(Numeric, nullable=False)
    origin_lng = Column(Numeric, nullable=False)
    
    dest_address = Column(Text, nullable=False)
    dest_lat = Column(Numeric, nullable=False)
    dest_lng = Column(Numeric, nullable=False)
    
    start_time = Column(DateTime, nullable=False)
    status = Column(String(20), default="pending")
    total_price = Column(Numeric, nullable=False, default=0)
    price_per_seat = Column(Numeric, nullable=False)
    total_seats = Column(Integer, nullable=False)
    available_seats = Column(Integer, nullable=False)
    
    # Passenger notes (optional, max 500 chars enforced at schema level)
    notes = Column(Text, nullable=True)
    
    start_otp = Column(String(6), nullable=True)
    completion_otp = Column(String(6), nullable=True)
    otp_verified = Column(Boolean, default=False)
    
    # Optimistic locking
    version = Column(Integer, default=0, nullable=False)
    
    # Cancellation tracking
    cancelled_at = Column(DateTime, nullable=True)
    cancelled_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    cancellation_penalty = Column(Numeric, default=0)
    
    # Payment tracking
    payment_intent_id = Column(String(255), nullable=True)
    payment_status = Column(String(20), default="pending")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    driver = relationship("Driver", back_populates="trips", foreign_keys=[driver_id])
    vehicle = relationship("Vehicle", back_populates="trips")
    bookings = relationship("Booking", back_populates="trip", cascade="all, delete-orphan")
    bids = relationship("TripBid", back_populates="trip", cascade="all, delete-orphan")
    locations = relationship("TripLocation", back_populates="trip", cascade="all, delete-orphan")
    cancelled_by_user = relationship("User", foreign_keys=[cancelled_by], overlaps="cancelled_by_user")
    creator_passenger = relationship("User", foreign_keys=[creator_passenger_id])
    passengers = relationship("User", secondary="trip_passengers", backref="joined_shared_trips")

# TripPassenger Association Table
class TripPassenger(Base):
    __tablename__ = "trip_passengers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=False)
    passenger_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    seats_booked = Column(Integer, default=1)

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
    notes = Column(Text, nullable=True)  # Per-passenger notes
    
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
    message = Column(String(500), nullable=True)
    
    # Optimistic locking for concurrent bid updates
    version = Column(Integer, default=0, nullable=False)
    
    # Counter bid tracking
    parent_bid_id = Column(UUID(as_uuid=True), ForeignKey("trip_bids.id"), nullable=True)
    is_counter_bid = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    trip = relationship("Trip", back_populates="bids")
    driver = relationship("Driver", back_populates="bids")
    parent_bid = relationship("TripBid", remote_side=[id], backref="counter_bids")

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

# PaymentMethod Model
class PaymentMethod(Base):
    __tablename__ = "payment_methods"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type = Column(String(20), nullable=False)  # card, upi, netbanking
    provider = Column(String(50), nullable=False)  # Visa, Mastercard, GPay, etc.
    last4 = Column(String(4), nullable=True)
    is_default = Column(Boolean, default=False)
    razorpay_token = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="payment_methods")

# Wallet Model
class Wallet(Base):
    __tablename__ = "wallets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    balance = Column(Numeric(10, 2), default=0.00)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="wallet")
    transactions = relationship("Transaction", back_populates="wallet", cascade="all, delete-orphan")

# Transaction Model
class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    wallet_id = Column(UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    type = Column(String(20), nullable=False)  # credit, payment, refund
    description = Column(Text, nullable=True)
    status = Column(String(20), default="pending")  # pending, completed, failed
    razorpay_order_id = Column(String(100), nullable=True)
    razorpay_payment_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    wallet = relationship("Wallet", back_populates="transactions")

# LiveLocation Model (for real-time tracking, latest only)
class LiveLocation(Base):
    __tablename__ = "live_locations"
    
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), primary_key=True)
    latitude = Column(Numeric, nullable=False)
    longitude = Column(Numeric, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    trip = relationship("Trip", back_populates="live_location_data")

Trip.live_location_data = relationship("LiveLocation", back_populates="trip", uselist=False)

