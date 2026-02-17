from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
from rate_limiter import rate_limit
import models
import schemas
import auth
import uuid
import logging

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)


@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
@rate_limit(max_requests=5, window_seconds=60, key_suffix="register")
def register(
    request: Request,
    user_data: schemas.UserRegister,
    db: Session = Depends(get_db)
):
    """Register a new user with rate limiting (5 per minute)"""
    
    try:
        # Check if user exists
        existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Validate role
        if user_data.role not in ["passenger", "driver"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be either 'passenger' or 'driver'"
            )
        
        # Create new user with UUID
        hashed_pwd = auth.hash_password(user_data.password)
        new_user = models.User(
            id=uuid.uuid4(),
            email=user_data.email,
            hashed_password=hashed_pwd,
            full_name=user_data.full_name,
            phone_number=user_data.phone,
            role=user_data.role
        )
        
        db.add(new_user)
        db.flush()  # Get the user ID before creating profiles
        
        # Create role-specific profile
        if user_data.role == "driver":
            driver_profile = models.Driver(
                user_id=new_user.id,
                license_number=user_data.license_number,
                rating=0.0,
                total_trips=0,
                is_online=False
            )
            db.add(driver_profile)
            
            # If vehicle info provided, create vehicle
            if user_data.vehicle_make and user_data.vehicle_model and user_data.vehicle_plate:
                vehicle = models.Vehicle(
                    id=uuid.uuid4(),
                    driver_id=new_user.id,
                    make=user_data.vehicle_make,
                    model=user_data.vehicle_model,
                    plate_number=user_data.vehicle_plate,
                    capacity=user_data.vehicle_capacity or 4,
                    is_active=True
                )
                db.add(vehicle)
        else:  # passenger
            passenger_profile = models.Passenger(
                user_id=new_user.id,
                preferences={}
            )
            db.add(passenger_profile)
        
        db.commit()
        db.refresh(new_user)
        
        # Attach driver-specific fields to the returned user object so Pydantic includes them
        if user_data.role == "driver":
            driver = db.query(models.Driver).filter(models.Driver.user_id == new_user.id).first()
            if driver:
                new_user.license_number = driver.license_number
                new_user.is_online = driver.is_online
                new_user.rating = driver.rating
                new_user.total_trips = driver.total_trips

        # Add role to response
        user_response = new_user
        user_response.role = user_data.role
        
        logger.info(f"New user registered: {new_user.email} with role {user_data.role}")
        
        return user_response
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error registering user: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user"
        )


@router.post("/login", response_model=schemas.Token)
@rate_limit(max_requests=10, window_seconds=60, key_suffix="login")
def login(
    request: Request,
    user_credentials: schemas.UserLogin,
    db: Session = Depends(get_db)
):
    """Login with rate limiting (10 attempts per minute)"""
    
    # Find user
    user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
    
    if not user or not auth.verify_password(user_credentials.password, user.hashed_password):
        logger.warning(f"Failed login attempt for email: {user_credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Determine role
    role = auth.get_user_role(user, db)
    
    # Create access token with UUID as string
    access_token = auth.create_access_token(data={"sub": str(user.id), "role": role})
    
    logger.info(f"User logged in: {user.email}")
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserResponse)
@rate_limit(max_requests=30, window_seconds=60, key_suffix="me")
def get_current_user_info(
    request: Request,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user info with rate limiting"""
    from datetime import datetime, timedelta
    from sqlalchemy import func
    
    # Add role to response
    user_response = current_user
    user_response.role = auth.get_user_role(current_user, db)
    
    # Add driver-specific fields if driver
    if user_response.role == "driver":
        driver = db.query(models.Driver).filter(models.Driver.user_id == current_user.id).first()
        if driver:
            user_response.license_number = driver.license_number
            user_response.is_online = driver.is_online
            user_response.rating = driver.rating
            user_response.total_trips = driver.total_trips
            
            # Compute today's earnings from completed trips
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            today_earnings_result = db.query(func.sum(models.Trip.price_per_seat)).filter(
                models.Trip.driver_id == current_user.id,
                models.Trip.status == "completed",
                models.Trip.updated_at >= today_start
            ).scalar()
            user_response.today_earnings = float(today_earnings_result) if today_earnings_result else 0
            
            # Compute online hours (approximate from active/completed trips today)
            today_trip_count = db.query(func.count(models.Trip.id)).filter(
                models.Trip.driver_id == current_user.id,
                models.Trip.status.in_(["active", "completed"]),
                models.Trip.updated_at >= today_start
            ).scalar() or 0
            user_response.online_hours = round(today_trip_count * 0.5, 1)  # estimate 30 min per trip
    else:
        # Passenger: count total trips via bookings
        from sqlalchemy import func as sqlfunc
        total = db.query(sqlfunc.count(models.Booking.id)).filter(
            models.Booking.passenger_id == current_user.id,
            models.Booking.status.in_(["confirmed", "completed"])
        ).scalar() or 0
        user_response.total_trips = total
    
    return user_response


@router.patch("/me", response_model=schemas.UserResponse)
@rate_limit(max_requests=10, window_seconds=60, key_suffix="update_me")
def update_current_user(
    request: Request,
    update_data: dict,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    
    # Allowed fields for update
    allowed_fields = {"full_name", "phone_number", "avatar_url"}
    
    try:
        for key, value in update_data.items():
            if key in allowed_fields and value is not None:
                setattr(current_user, key, value)
        
        db.commit()
        db.refresh(current_user)
        
        # Re-populate role and driver fields for response
        current_user.role = auth.get_user_role(current_user, db)
        
        if current_user.role == "driver":
            driver = db.query(models.Driver).filter(models.Driver.user_id == current_user.id).first()
            if driver:
                current_user.license_number = driver.license_number
                current_user.is_online = driver.is_online
                current_user.rating = driver.rating
                current_user.total_trips = driver.total_trips
        
        logger.info(f"User profile updated: {current_user.email}")
        return current_user
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating profile: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )

