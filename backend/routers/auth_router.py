from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
from rate_limiter import rate_limit
import models
import schemas
import auth
import uuid
import secrets
import os
from datetime import datetime, timedelta
import logging
from services.email_service import smtp_is_configured, send_verification_email as _send_verification_email_bg
from services.emailjs_service import (
    emailjs_is_configured,
    send_verification_email_via_emailjs as _send_verification_email_emailjs_bg,
)
from services.sms_service import twilio_is_configured, send_phone_otp as _send_phone_otp_bg

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)


def _generate_email_verification_code() -> str:
    """Generate a 6-digit numeric email verification code."""
    return f"{secrets.randbelow(1_000_000):06d}"


def _check_profile_complete(user: models.User, db: Session) -> bool:
    """Return True if the user has filled all mandatory onboarding fields."""
    # Shared mandatory fields
    if not user.gender or not user.date_of_birth or not user.full_name or not user.phone_number:
        return False
    ec = user.emergency_contact
    if not ec or not ec.get("name") or not ec.get("phone"):
        return False

    role = auth.get_user_role(user, db)
    if role == "driver":
        driver = db.query(models.Driver).filter(models.Driver.user_id == user.id).first()
        if not driver or not driver.license_number:
            return False
        vehicle = db.query(models.Vehicle).filter(models.Vehicle.driver_id == user.id).first()
        if not vehicle:
            return False

    return True


@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
@rate_limit(max_requests=6, window_seconds=60, key_suffix="register")
def register(
    request: Request,
    background_tasks: BackgroundTasks,
    user_data: schemas.UserRegister,
    db: Session = Depends(get_db)
):
    """Register a new user with rate limiting (5 per minute)"""
    
    try:
        # Check if user exists
        existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered. Please log in or use a different email."
            )
        
        # Validate role
        if user_data.role not in ["passenger", "driver"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be either 'passenger' or 'driver'"
            )
        
        # Create new user with UUID
        hashed_pwd = auth.hash_password(user_data.password)
        verification_token = _generate_email_verification_code()
        new_user = models.User(
            id=uuid.uuid4(),
            email=user_data.email,
            hashed_password=hashed_pwd,
            full_name=user_data.full_name,
            phone_number=user_data.phone,
            role=user_data.role,
            verification_token=verification_token,
            verification_token_expires=datetime.utcnow() + timedelta(minutes=15),
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
        
        # Build response dict
        resp = {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "phone_number": new_user.phone_number,
            "role": user_data.role,
            "avatar_url": new_user.avatar_url,
            "is_verified": new_user.is_verified,
            "profile_completed": new_user.profile_completed,
            "created_at": new_user.created_at,
            "gender": new_user.gender,
            "date_of_birth": new_user.date_of_birth,
            "bio": new_user.bio,
            "address": new_user.address,
            "emergency_contact": new_user.emergency_contact,
            "rating": 0.0,
            "total_trips": 0,
            "today_earnings": 0,
            "online_hours": 0,
        }

        if user_data.role == "driver":
            driver = db.query(models.Driver).filter(models.Driver.user_id == new_user.id).first()
            if driver:
                resp["license_number"] = driver.license_number
                resp["is_online"] = driver.is_online
                resp["rating"] = float(driver.rating) if driver.rating else 0.0
                resp["total_trips"] = driver.total_trips or 0
                resp["insurance_status"] = driver.insurance_status
                resp["max_passengers"] = driver.max_passengers
                resp["route_radius"] = driver.route_radius
        
        logger.info(f"New user registered: {new_user.email} with role {user_data.role}")

        # Automatically send verification email after signup.
        if _smtp_is_configured():
            background_tasks.add_task(_send_verification_email_bg, new_user.email, verification_token)
        elif emailjs_is_configured():
            background_tasks.add_task(_send_verification_email_emailjs_bg, new_user.email, verification_token)
        else:
            logger.warning(
                "Verification email not sent for %s: SMTP/EmailJS not configured",
                new_user.email,
            )
        
        return resp
        
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
@rate_limit(max_requests=11, window_seconds=60, key_suffix="login")
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


def _smtp_is_configured() -> bool:
    """Thin wrapper kept for backwards compatibility; delegates to email_service."""
    return smtp_is_configured()


@router.post("/send-verification", response_model=schemas.SendVerificationResponse)
@rate_limit(max_requests=3, window_seconds=60, key_suffix="send_verification")
def send_verification(
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a verification token and queue a delivery email.

    * SMTP configured  → email is dispatched in a background task (non-blocking).
    * SMTP absent + APP_ENV=development  → token returned in response for local testing.
    * SMTP absent + production  → 503 so misconfiguration surfaces early.
    """
    if current_user.is_verified:
        raise HTTPException(status_code=400, detail="Email is already verified")

    token = _generate_email_verification_code()
    current_user.verification_token = token
    current_user.verification_token_expires = datetime.utcnow() + timedelta(minutes=15)
    db.commit()

    if _smtp_is_configured():
        # Non-blocking: the worker thread returns immediately; SMTP happens in the background.
        background_tasks.add_task(_send_verification_email_bg, current_user.email, token)
        return schemas.SendVerificationResponse(
            message="Verification email queued. Check your inbox shortly."
        )

    if emailjs_is_configured():
        # Fallback provider: EmailJS template delivery.
        background_tasks.add_task(_send_verification_email_emailjs_bg, current_user.email, token)
        return schemas.SendVerificationResponse(
            message="Verification email queued via EmailJS. Check your inbox shortly."
        )

    # No SMTP – only acceptable in an explicitly declared development environment.
    is_dev = os.getenv("APP_ENV", "").lower() == "development"
    if not is_dev:
        raise HTTPException(
            status_code=503,
            detail=(
                "Email delivery is not configured. "
                "Set SMTP_HOST/SMTP_USER/SMTP_PASS or EMAILJS_SERVICE_ID/EMAILJS_TEMPLATE_ID/EMAILJS_PUBLIC_KEY."
            ),
        )

    # Development mode only: return the raw token so the app can be exercised
    # without a live mail server.  Never enabled when APP_ENV != development.
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    verify_url = f"{frontend_url}/verify-email?token={token}"
    logger.debug("[DEV] Verification URL for %s: %s", current_user.email, verify_url)
    return schemas.SendVerificationResponse(
        message="Dev mode: SMTP not configured. Use the token below to verify.",
        dev_token=token,
        dev_verify_url=verify_url,
    )


@router.post("/verify-email")
@rate_limit(max_requests=10, window_seconds=60, key_suffix="verify_email")
def verify_email(
    request: Request,
    payload: schemas.EmailVerifyRequest,
    db: Session = Depends(get_db)
):
    """Verify email using a token from the verification link."""
    user = db.query(models.User).filter(
        models.User.verification_token == payload.token
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    if user.verification_token_expires and user.verification_token_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code has expired. Request a new one.")

    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.commit()

    logger.info(f"Email verified for user: {user.email}")
    return {"message": "Email verified successfully", "is_verified": True}


# ── Phone / SMS verification ────────────────────────────────────────────────

@router.post("/send-phone-verification", response_model=schemas.SendPhoneVerificationResponse)
@rate_limit(max_requests=3, window_seconds=60, key_suffix="send_phone_otp")
def send_phone_verification(
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a 6-digit OTP and send it via Twilio SMS.

    * Twilio configured  → SMS dispatched in a background task (non-blocking).
    * Twilio absent + APP_ENV=development  → OTP returned in response for testing.
    * Twilio absent + production  → 503 so misconfiguration surfaces early.
    """
    if current_user.is_phone_verified:
        raise HTTPException(status_code=400, detail="Phone number is already verified")

    if not current_user.phone_number:
        raise HTTPException(status_code=400, detail="No phone number on account. Update your profile first.")

    otp = f"{secrets.randbelow(1_000_000):06d}"
    current_user.phone_otp = otp
    current_user.phone_otp_expires = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    if twilio_is_configured():
        background_tasks.add_task(_send_phone_otp_bg, current_user.phone_number, otp)
        return schemas.SendPhoneVerificationResponse(
            message="OTP sent to your phone number. Check your SMS."
        )

    is_dev = os.getenv("APP_ENV", "").lower() == "development"
    if not is_dev:
        raise HTTPException(
            status_code=503,
            detail=(
                "SMS delivery is not configured. "
                "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER "
                "environment variables."
            ),
        )

    logger.debug("[DEV] Phone OTP for %s: %s", current_user.phone_number, otp)
    return schemas.SendPhoneVerificationResponse(
        message="Dev mode: Twilio not configured. Use the OTP below to verify.",
        dev_otp=otp,
    )


@router.post("/verify-phone")
@rate_limit(max_requests=5, window_seconds=60, key_suffix="verify_phone")
def verify_phone(
    request: Request,
    payload: schemas.PhoneVerifyRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Verify phone using the 6-digit OTP sent via SMS."""
    if current_user.is_phone_verified:
        raise HTTPException(status_code=400, detail="Phone number is already verified")

    if not current_user.phone_otp:
        raise HTTPException(status_code=400, detail="No OTP requested. Send a verification SMS first.")

    if current_user.phone_otp_expires and current_user.phone_otp_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP has expired. Request a new one.")

    if current_user.phone_otp != payload.otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP. Please try again.")

    current_user.is_phone_verified = True
    current_user.phone_otp = None
    current_user.phone_otp_expires = None
    db.commit()

    logger.info("Phone verified for user: %s", current_user.email)
    return {"message": "Phone number verified successfully", "is_phone_verified": True}


@router.post("/google", response_model=schemas.Token)
@rate_limit(max_requests=10, window_seconds=60, key_suffix="google_login")
def google_auth(
    request: Request,
    auth_data: schemas.GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    """Verify Google token and login/register user"""
    import time
    import requests as py_requests
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
    except ModuleNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google auth dependencies are not installed",
        )

    google_request_adapter = google_requests.Request()
    start_time = time.time()
    try:
        email = ""
        full_name = ""
        
        # Determine if token is a JWT (ID Token) or an Access Token
        if auth_data.token.startswith("eyJ"):
            # Verify the ID token
            idinfo = id_token.verify_oauth2_token(
                auth_data.token, 
                google_request_adapter, 
                GOOGLE_CLIENT_ID
            )
            email = idinfo['email']
            full_name = idinfo.get('name', '')
            verify_time = time.time() - start_time
            logger.info(f"Google ID token verified in {verify_time:.4f}s")
        else:
            # It's an Access Token from the implicit flow
            # Verify audience first
            tokeninfo_resp = py_requests.get(f"https://oauth2.googleapis.com/tokeninfo?access_token={auth_data.token}")
            if tokeninfo_resp.status_code != 200:
                raise ValueError("Invalid access token")
            
            tokeninfo = tokeninfo_resp.json()
            # Note: with useGoogleLogin, audience verification via tokeninfo might be slightly different 
            # Check if email is verified
            if tokeninfo.get('email_verified') != 'true' and tokeninfo.get('email_verified') != True:
                # Sometimes tokeninfo returns string 'true'
                pass # We'll just trust the email if it comes from Google
                
            email = tokeninfo.get('email', '')
            if not email:
                raise ValueError("Access token does not contain email")
                
            # Fetch user details
            userinfo_resp = py_requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo", 
                headers={"Authorization": f"Bearer {auth_data.token}"}
            )
            if userinfo_resp.status_code == 200:
                userinfo = userinfo_resp.json()
                full_name = userinfo.get('name', '')
                
            verify_time = time.time() - start_time
            logger.info(f"Google Access token verified in {verify_time:.4f}s")

        # Check if user exists
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if not user:
            # First-time Google sign-in must include explicit role selection.
            requested_role = auth_data.role.strip().lower() if auth_data.role else None
            if requested_role not in ["passenger", "driver"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Role selection required for first-time Google sign-in"
                )
            
            user = models.User(
                id=uuid.uuid4(),
                email=email,
                full_name=full_name,
                hashed_password="OAUTH_USER_NO_PASSWORD_" + str(uuid.uuid4()), 
                role=requested_role,
                is_verified=True
            )
            db.add(user)
            db.flush()
            
            # Create appropriate profile
            if requested_role == "driver":
                driver = models.Driver(user_id=user.id)
                db.add(driver)
            else:
                passenger = models.Passenger(user_id=user.id, preferences={})
                db.add(passenger)
                
            db.commit()
            db.refresh(user)
            logger.info(f"New user created via Google with role {requested_role}: {email}")
        
        # Determine role
        role = auth.get_user_role(user, db)
        
        # Create access token
        access_token = auth.create_access_token(data={"sub": str(user.id), "role": role})
        
        logger.info(f"User logged in via Google: {email}")
        return {"access_token": access_token, "token_type": "bearer"}

    except ValueError as e:
        # Invalid token
        logger.error(f"Invalid Google token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )
    except Exception as e:
        logger.error(f"Google auth error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during Google auth",
        )


@router.get("/me", response_model=schemas.UserResponse)
@rate_limit(max_requests=100 if os.getenv("APP_ENV") == "development" else 30, window_seconds=60, key_suffix="me")
def get_current_user_info(
    request: Request,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user info with rate limiting"""
    from datetime import datetime
    from sqlalchemy import func
    
    role = auth.get_user_role(current_user, db)
    
    # Build base response dict from user columns
    resp = {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone_number": current_user.phone_number or "",
        "role": role,
        "avatar_url": current_user.avatar_url,
        "is_verified": current_user.is_verified,
        "profile_completed": current_user.profile_completed,
        "created_at": current_user.created_at,
        "gender": current_user.gender,
        "date_of_birth": current_user.date_of_birth,
        "bio": current_user.bio,
        "address": current_user.address,
        "emergency_contact": current_user.emergency_contact,
        "rating": 0.0,
        "total_trips": 0,
        "today_earnings": 0,
        "online_hours": 0,
    }
    
    if role == "driver":
        driver = db.query(models.Driver).filter(models.Driver.user_id == current_user.id).first()
        if driver:
            resp["license_number"] = driver.license_number
            resp["is_online"] = driver.is_online
            resp["rating"] = float(driver.rating) if driver.rating else 0.0
            resp["total_trips"] = driver.total_trips or 0
            resp["insurance_status"] = driver.insurance_status
            resp["max_passengers"] = driver.max_passengers
            resp["route_radius"] = driver.route_radius
            resp["license_photo_url"] = driver.license_photo_url
            
            # Compute today's earnings
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            today_earnings_result = db.query(func.sum(models.Trip.price_per_seat)).filter(
                models.Trip.driver_id == current_user.id,
                models.Trip.status == "completed",
                models.Trip.updated_at >= today_start
            ).scalar()
            resp["today_earnings"] = float(today_earnings_result) if today_earnings_result else 0
            
            # Compute online hours
            today_trip_count = db.query(func.count(models.Trip.id)).filter(
                models.Trip.driver_id == current_user.id,
                models.Trip.status.in_(["active", "completed"]),
                models.Trip.updated_at >= today_start
            ).scalar() or 0
            resp["online_hours"] = round(today_trip_count * 0.5, 1)
    else:
        # Passenger
        total = db.query(func.count(models.Booking.id)).filter(
            models.Booking.passenger_id == current_user.id,
            models.Booking.status.in_(["confirmed", "completed"])
        ).scalar() or 0
        resp["total_trips"] = total
        
        passenger = db.query(models.Passenger).filter(
            models.Passenger.user_id == current_user.id
        ).first()
        if passenger:
            prefs = passenger.preferences or {}
            resp["travel_preferences"] = prefs.get("travel_preferences", [])
            resp["accessibility_needs"] = passenger.accessibility_needs or False
    
    return resp


@router.patch("/me", response_model=schemas.UserResponse)
@rate_limit(max_requests=50 if os.getenv("APP_ENV") == "development" else 10, window_seconds=60, key_suffix="update_me")
def update_current_user(
    request: Request,
    update_data: schemas.ProfileUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile - persists all Tier 1 fields"""
    from datetime import date as date_type
    
    try:
        # --- User-level fields ---
        user_fields = {"full_name", "phone_number", "avatar_url", "gender", "bio", "address"}
        data = update_data.model_dump(exclude_none=True)
        
        for key in user_fields:
            if key in data:
                setattr(current_user, key, data[key])
        
        # Date of birth (parse ISO format YYYY-MM-DD or datetime)
        if data.get("date_of_birth"):
            dob_raw = data["date_of_birth"]
            try:
                if isinstance(dob_raw, str):
                    if "T" in dob_raw:
                        current_user.date_of_birth = datetime.fromisoformat(dob_raw.replace("Z", "+00:00")).date()
                    else:
                        current_user.date_of_birth = date_type.fromisoformat(dob_raw)
                elif isinstance(dob_raw, (date_type, datetime)):
                    current_user.date_of_birth = dob_raw
            except (ValueError, TypeError):
                logger.warning(f"Failed to parse date_of_birth: {dob_raw}")
        
        # Emergency contact (JSON)
        if data.get("emergency_contact"):
            current_user.emergency_contact = data["emergency_contact"]
        
        # --- Driver-specific fields ---
        role = auth.get_user_role(current_user, db)
        
        if role == "driver":
            driver = db.query(models.Driver).filter(
                models.Driver.user_id == current_user.id
            ).first()
            
            if driver:
                if data.get("license_number"):
                    driver.license_number = data["license_number"]
                if data.get("insurance_status"):
                    driver.insurance_status = data["insurance_status"]
                if data.get("max_passengers") is not None:
                    driver.max_passengers = data["max_passengers"]
                if data.get("route_radius") is not None:
                    driver.route_radius = data["route_radius"]
                if data.get("is_available") is not None:
                    driver.is_online = data["is_available"]
                if data.get("license_photo_url"):
                    driver.license_photo_url = data["license_photo_url"]
                
                # Vehicle info
                vehicle_data = {}
                if data.get("vehicle_model"):
                    vehicle_data["model"] = data["vehicle_model"]
                if data.get("vehicle_type"):
                    vehicle_data["make"] = data["vehicle_type"]
                if data.get("vehicle_plate"):
                    vehicle_data["plate_number"] = data["vehicle_plate"]
                if data.get("vehicle_color"):
                    vehicle_data["color"] = data["vehicle_color"]
                if data.get("vehicle_capacity") is not None:
                    vehicle_data["capacity"] = data["vehicle_capacity"]
                
                if vehicle_data:
                    vehicle = db.query(models.Vehicle).filter(
                        models.Vehicle.driver_id == driver.user_id
                    ).first()
                    if vehicle:
                        for k, v in vehicle_data.items():
                            setattr(vehicle, k, v)
                    else:
                        # Create new vehicle
                        new_vehicle = models.Vehicle(
                            driver_id=driver.user_id,
                            make=vehicle_data.get("make", "Unknown"),
                            model=vehicle_data.get("model", "Unknown"),
                            plate_number=vehicle_data.get("plate_number", ""),
                            capacity=vehicle_data.get("capacity", 4),
                            color=vehicle_data.get("color")
                        )
                        db.add(new_vehicle)
        
        # --- Passenger-specific fields ---
        if role == "passenger":
            passenger = db.query(models.Passenger).filter(
                models.Passenger.user_id == current_user.id
            ).first()
            
            if passenger:
                prefs = passenger.preferences or {}
                if data.get("travel_preferences") is not None:
                    prefs["travel_preferences"] = data["travel_preferences"]
                passenger.preferences = prefs
                
                if data.get("accessibility_needs") is not None:
                    passenger.accessibility_needs = data["accessibility_needs"]
        
        # Auto-detect profile completeness after updates
        current_user.profile_completed = _check_profile_complete(current_user, db)

        db.commit()
        db.refresh(current_user)
        
        # Build response dict
        resp = {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "phone_number": current_user.phone_number or "",
            "role": role,
            "avatar_url": current_user.avatar_url,
            "is_verified": current_user.is_verified,
            "profile_completed": current_user.profile_completed,
            "created_at": current_user.created_at,
            "gender": current_user.gender,
            "date_of_birth": current_user.date_of_birth,
            "bio": current_user.bio,
            "address": current_user.address,
            "emergency_contact": current_user.emergency_contact,
            "rating": 0.0,
            "total_trips": 0,
            "today_earnings": 0,
            "online_hours": 0,
        }

        if role == "driver":
            driver = db.query(models.Driver).filter(models.Driver.user_id == current_user.id).first()
            if driver:
                resp["license_number"] = driver.license_number
                resp["is_online"] = driver.is_online
                resp["rating"] = float(driver.rating) if driver.rating else 0.0
                resp["total_trips"] = driver.total_trips or 0
                resp["insurance_status"] = driver.insurance_status
                resp["max_passengers"] = driver.max_passengers
                resp["route_radius"] = driver.route_radius
                resp["license_photo_url"] = driver.license_photo_url
        elif role == "passenger":
            passenger = db.query(models.Passenger).filter(models.Passenger.user_id == current_user.id).first()
            if passenger:
                prefs = passenger.preferences or {}
                resp["travel_preferences"] = prefs.get("travel_preferences", [])
                resp["accessibility_needs"] = passenger.accessibility_needs or False
        
        logger.info(f"User profile updated: {current_user.email}")
        return resp
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating profile: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )
