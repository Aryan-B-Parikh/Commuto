from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
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

# Emergency Contact Schema
class EmergencyContactSchema(BaseModel):
    name: Optional[str] = None
    relationship: Optional[str] = None
    phone: Optional[str] = None

# Profile Update Schema
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None  # ISO format string
    bio: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[EmergencyContactSchema] = None
    
    # Driver fields
    license_number: Optional[str] = None
    insurance_status: Optional[str] = None
    max_passengers: Optional[int] = None
    route_radius: Optional[int] = None
    is_available: Optional[bool] = None
    
    # Vehicle fields
    vehicle_type: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_color: Optional[str] = None
    vehicle_capacity: Optional[int] = None
    
    # Passenger fields
    travel_preferences: Optional[List[str]] = None
    accessibility_needs: Optional[bool] = None

class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    phone_number: str
    role: str
    avatar_url: Optional[str] = None
    is_verified: bool = False
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
