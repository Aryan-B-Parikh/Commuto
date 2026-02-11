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
    
    return user_response
