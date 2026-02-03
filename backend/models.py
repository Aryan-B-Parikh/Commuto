from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

class UserRole(str, enum.Enum):
    PASSENGER = "passenger"
    DRIVER = "driver"

class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer-not-to-say"

class InsuranceStatus(str, enum.Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    PENDING = "pending"

class TripStatus(str, enum.Enum):
    PENDING = "pending"
    BIDDING = "bidding"
    ACCEPTED = "accepted"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class BidStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    COUNTERED = "countered"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    avatar = Column(String, nullable=True)
    gender = Column(Enum(Gender), default=Gender.OTHER)
    date_of_birth = Column(String, nullable=True)
    address = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    rating = Column(Float, default=0.0)
    total_trips = Column(Integer, default=0)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Emergency contact
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_relationship = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)
    
    # Driver-specific fields
    vehicle_type = Column(String, nullable=True)
    vehicle_model = Column(String, nullable=True)
    vehicle_plate_number = Column(String, nullable=True)
    vehicle_color = Column(String, nullable=True)
    vehicle_seat_capacity = Column(Integer, nullable=True)
    license_number = Column(String, nullable=True)
    insurance_status = Column(Enum(InsuranceStatus), nullable=True)
    registration_url = Column(String, nullable=True)
    max_passengers = Column(Integer, nullable=True)
    route_radius = Column(Float, nullable=True)
    is_available = Column(Boolean, default=False)
    
    # Relationships
    trips_as_passenger = relationship("Trip", back_populates="passenger", foreign_keys="Trip.passenger_id")
    trips_as_driver = relationship("Trip", back_populates="driver", foreign_keys="Trip.driver_id")
    bids = relationship("Bid", back_populates="driver")

class Trip(Base):
    __tablename__ = "trips"
    
    id = Column(String, primary_key=True, index=True)
    passenger_id = Column(String, ForeignKey("users.id"), nullable=False)
    driver_id = Column(String, ForeignKey("users.id"), nullable=True)
    
    from_address = Column(String, nullable=False)
    from_lat = Column(Float, nullable=False)
    from_lng = Column(Float, nullable=False)
    
    to_address = Column(String, nullable=False)
    to_lat = Column(Float, nullable=False)
    to_lng = Column(Float, nullable=False)
    
    date = Column(String, nullable=False)
    time = Column(String, nullable=False)
    seats_requested = Column(Integer, default=1)
    price_per_seat = Column(Float, nullable=True)
    
    status = Column(Enum(TripStatus), default=TripStatus.PENDING)
    distance = Column(String, nullable=True)
    duration = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    passenger = relationship("User", back_populates="trips_as_passenger", foreign_keys=[passenger_id])
    driver = relationship("User", back_populates="trips_as_driver", foreign_keys=[driver_id])
    bids = relationship("Bid", back_populates="trip", cascade="all, delete-orphan")
    active_ride = relationship("ActiveRide", back_populates="trip", uselist=False, cascade="all, delete-orphan")

class Bid(Base):
    __tablename__ = "bids"
    
    id = Column(String, primary_key=True, index=True)
    trip_id = Column(String, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    driver_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    amount = Column(Float, nullable=False)
    message = Column(Text, nullable=True)
    status = Column(Enum(BidStatus), default=BidStatus.PENDING)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    trip = relationship("Trip", back_populates="bids")
    driver = relationship("User", back_populates="bids")

class ActiveRide(Base):
    __tablename__ = "active_rides"
    
    id = Column(String, primary_key=True, index=True)
    trip_id = Column(String, ForeignKey("trips.id", ondelete="CASCADE"), unique=True, nullable=False)
    otp = Column(String(6), nullable=False)
    otp_verified = Column(Boolean, default=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    trip = relationship("Trip", back_populates="active_ride")
