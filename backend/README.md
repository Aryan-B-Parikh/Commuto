# Commuto Backend API

FastAPI-based backend for the Commuto ride-sharing application.

## Tech Stack
- **Framework**: FastAPI
- **Database**: PostgreSQL (Neon)
- **ORM**: SQLAlchemy
- **Auth**: JWT (python-jose)
- **WebSocket**: Native FastAPI support

## Setup

1. **Install dependencies:**
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

2. **Configure environment:**
- Update `.env` with your database URL and secret key

3. **Run server:**
```bash
python main.py
```

Server will start at `http://localhost:8000`

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info

### Rides
- `POST /rides/request` - Create ride request
- `GET /rides/open` - List available rides (drivers only)
- `POST /rides/{id}/cancel` - Cancel a ride

### Bidding
- `POST /bids/{ride_id}` - Place a bid (drivers only)
- `GET /bids/{ride_id}/all` - Get all bids for a ride (passenger only)
- `POST /bids/{bid_id}/accept` - Accept a bid (passenger only)
- `POST /bids/{bid_id}/counter` - Counter bid offer

### OTP & Ride Management
- `POST /rides/{trip_id}/verify-otp` - Verify OTP and start ride
- `POST /rides/{trip_id}/complete` - Complete ride

### WebSocket
- `WS /ws/{token}` - Real-time connection (use JWT token)

## Events
WebSocket events:
- `new_ride_request` - Notify drivers of new rides
- `new_bid` - Notify passenger of new bids
- `bid_status_update` - Notify driver of bid status changes
- `ride_status` - Notify about ride status updates

## Database Schema

Includes models for:
- Users (Passenger/Driver with role-based fields)
- Trips
- Bids
- ActiveRides (OTP management)
