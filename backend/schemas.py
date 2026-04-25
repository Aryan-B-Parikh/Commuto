from pydantic import BaseModel, EmailStr, Field, field_validator
import re
from typing import Optional, List
from datetime import datetime, date, timedelta
from uuid import UUID

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    phone: str
    role: str  # "passenger" or "driver"

    @field_validator('email')
    def validate_email(cls, v):
        # Basic common-sense length & pattern checks
        if len(v) < 5:
            raise ValueError("Email is too short.")
        
        # Block common testing/fake emails
        banned_patterns = ["test@test", "email@email", "a@a.com", "example@example", "123@123"]
        if any(pattern in v.lower() for pattern in banned_patterns):
            raise ValueError("Please provide a legitimate email address.")
            
        if " " in v:
            raise ValueError("Email cannot contain spaces.")
        return v.lower()

    @field_validator('phone')
    def validate_phone(cls, v):
        # Remove common prefixes and non-digit characters
        cleaned = re.sub(r'[\s\-\+\(\)]', '', v)
        if cleaned.startswith('91') and len(cleaned) == 12:
            cleaned = cleaned[2:]
        
        # Must be 10 digits starting with 6-9
        if not re.match(r'^[6-9]\d{9}$', cleaned):
            raise ValueError("Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9.")
            
        # Check for repetitive digits (e.g., 1111111111)
        if len(set(cleaned)) == 1:
            raise ValueError("Invalid phone number. Repetitive digits are not allowed.")
            
        return cleaned
    
    # Optional driver fields
    license_number: Optional[str] = None
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_capacity: Optional[int] = Field(default=3, ge=1, le=4)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    token: str
    role: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

# Emergency Contact Schema
class EmergencyContactSchema(BaseModel):
    name: Optional[str] = None
    relationship: Optional[str] = None
    phone: Optional[str] = None

# Profile Update Schema
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None

    @field_validator('phone_number')
    def validate_phone_number(cls, v):
        if v is None:
            return v
        # Reuse logic
        cleaned = re.sub(r'[\s\-\+\(\)]', '', v)
        if cleaned.startswith('91') and len(cleaned) == 12:
            cleaned = cleaned[2:]
        if not re.match(r'^[6-9]\d{9}$', cleaned):
            raise ValueError("Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9.")
        if len(set(cleaned)) == 1:
            raise ValueError("Invalid phone number. Repetitive digits are not allowed.")
        return cleaned
    avatar_url: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None  # ISO format string
    bio: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[EmergencyContactSchema] = None
    
    # Driver fields
    license_number: Optional[str] = None
    insurance_status: Optional[str] = None
    max_passengers: Optional[int] = Field(default=None, ge=1, le=4)
    route_radius: Optional[int] = None
    is_available: Optional[bool] = None
    license_photo_url: Optional[str] = None
    
    # Vehicle fields
    vehicle_type: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_color: Optional[str] = None
    vehicle_capacity: Optional[int] = Field(default=None, ge=1, le=4)

    @field_validator('vehicle_type')
    def validate_vehicle_type(cls, v):
        if v and v.lower() not in ["auto-rickshaw", "rickshaw", "rikshaw"]:
            raise ValueError("Commuto is currently only available for Auto-Rickshaws.")
        return "Auto-Rickshaw"
    
    # Passenger fields
    accessibility_needs: Optional[bool] = None

    @field_validator('date_of_birth', mode='after')
    @classmethod
    def validate_age_threshold(cls, v: Optional[str]) -> Optional[str]:
        if v:
            try:
                # Expecting ISO YYYY-MM-DD
                dob = date.fromisoformat(v)
                today = date.today()
                
                # Check for 15 year threshold
                # Using 365.25 for average days in year including leap years
                min_age_date = today - timedelta(days=15 * 365.25)
                
                if dob > min_age_date:
                    raise ValueError("You must be at least 15 years old to join Commuto.")
                    
            except ValueError as e:
                # Re-raise if it's our custom age error
                if "15 years old" in str(e):
                    raise e
                raise ValueError(f"Invalid date format for birth date: {v}. Expected YYYY-MM-DD.")
        return v

class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    phone_number: str
    role: str
    avatar_url: Optional[str] = None
    is_verified: bool = False
    is_phone_verified: bool = False
    profile_completed: bool = False
    rating: Optional[float] = 0.0
    total_trips: Optional[int] = 0
    today_earnings: Optional[float] = 0
    online_hours: Optional[float] = 0
    created_at: datetime
    
    # Profile fields
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    bio: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[dict] = None
    
    # Driver-specific fields (optional)
    license_number: Optional[str] = None
    is_online: Optional[bool] = False
    insurance_status: Optional[str] = None
    max_passengers: Optional[int] = None
    route_radius: Optional[int] = None
    license_photo_url: Optional[str] = None
    
    # Passenger-specific fields
    travel_preferences: Optional[list] = None
    accessibility_needs: Optional[bool] = None
    
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

# Payment Method Schemas
class PaymentMethodCreate(BaseModel):
    type: str  # card, upi, netbanking
    provider: str  # Visa, Mastercard, GPay
    last4: Optional[str] = None
    is_default: bool = False

class PaymentMethodResponse(BaseModel):
    id: UUID
    type: str
    provider: str
    last4: Optional[str] = None
    is_default: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Wallet Schemas
class WalletResponse(BaseModel):
    id: UUID
    balance: float
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AddMoneyRequest(BaseModel):
    amount: float = Field(gt=0, le=50000)

class RazorpayOrderResponse(BaseModel):
    order_id: str
    amount: int  # in paise
    currency: str
    key: str

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class TransactionResponse(BaseModel):
    id: UUID
    amount: float
    type: str
    description: Optional[str] = None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class TransferRequest(BaseModel):
    recipient_email: EmailStr
    amount: float = Field(gt=0, le=50000)
    note: Optional[str] = None

# Trip Payment Schemas
class TripPaymentOrderResponse(BaseModel):
    order_id: str
    amount: int  # in paise
    currency: str
    key: str
    trip_id: UUID
    booking_id: UUID

class TripPaymentVerifyRequest(BaseModel):
    trip_id: UUID
    booking_id: UUID
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class SendVerificationResponse(BaseModel):
    message: str
    # In dev mode only: the token is returned so the user can verify without email
    dev_token: Optional[str] = None
    dev_verify_url: Optional[str] = None

class EmailVerifyRequest(BaseModel):
    token: str

# ── SMS / Phone verification ─────────────────────────────────────────────────

class SendPhoneVerificationResponse(BaseModel):
    message: str
    # In dev mode only: OTP returned directly so the app works without Twilio
    dev_otp: Optional[str] = None

class PhoneVerifyRequest(BaseModel):
    otp: str = Field(min_length=6, max_length=6, pattern=r'^\d{6}$')

class DriverRatingRequest(BaseModel):
    rating: float = Field(ge=1.0, le=5.0, description="Rating between 1 and 5")
    comment: Optional[str] = None
