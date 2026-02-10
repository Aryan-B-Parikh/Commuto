# Commuto - Ride-Sharing Platform

A modern ride-sharing/carpool application with a bidding-based matching system. Passengers post ride requests, drivers place bids, and passengers can accept or counter-offer to find the best match.

## 🏗️ Architecture

This is a monorepo containing:

- **Backend**: FastAPI REST API + WebSocket server
- **Frontend**: Next.js 16 (App Router) React application

## 🚀 Tech Stack

### Backend
- **Framework**: FastAPI 0.115.0
- **Database**: PostgreSQL (via Neon)
- **ORM**: SQLAlchemy 2.0
- **Auth**: JWT tokens (python-jose) with bcrypt password hashing
- **Rate Limiting**: SlowAPI with Redis support
- **Real-time**: WebSocket support for live updates

### Frontend
- **Framework**: Next.js 16 with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **HTTP Client**: Axios
- **Maps**: Leaflet + React-Leaflet
- **Animations**: Framer Motion

## 📁 Project Structure

```
commuto/
├── backend/          # FastAPI backend
│   ├── routers/      # API route handlers
│   ├── models.py     # SQLAlchemy database models
│   ├── schemas.py    # Pydantic schemas
│   ├── auth.py       # Authentication utilities
│   ├── database.py   # Database configuration
│   ├── websocket_manager.py  # WebSocket connection management
│   ├── tests/        # Organized test suite
│   └── main.py       # Application entry point
│
└── frontend/         # Next.js frontend
    └── src/
        ├── app/      # App Router pages
        ├── components/ # Reusable UI components
        ├── context/  # React Context providers
        ├── hooks/    # Custom React hooks
        ├── services/ # API client services
        ├── types/    # TypeScript type definitions
        └── utils/    # Utility functions
```

## 🛠️ Setup Instructions

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL database (or Neon account)
- Redis (optional, for distributed rate limiting)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   pip install email-validator  # Optional but recommended
   ```

4. Create a `.env` file in the `backend/` directory (see `.env.example`):
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database
   SECRET_KEY=your-secret-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   CORS_ALLOW_ORIGINS=http://localhost:3000
   ```

5. Run the server:
   ```bash
   python main.py
   ```

   The API will be available at `http://localhost:8000`
   - Swagger docs: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the `frontend/` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## 🔑 Key Features

### Authentication & User Management
- User registration with role selection (driver/passenger)
- JWT-based authentication
- Role-based access control
- Driver profiles with vehicle information
- Passenger preferences
- Rate limiting on authentication endpoints (5 registrations/min, 10 logins/min)

### Ride Requests (Passenger Flow)
- Create ride requests with origin/destination
- Set preferred departure time (must be in the future)
- Specify number of seats needed (1-4)
- View all incoming bids from drivers
- Accept or counter-offer bids
- Cancel pending requests with penalty calculation

### Driver Marketplace
- Browse open ride requests
- Filter by location and time
- Place competitive bids (rate limited: 5 bids/min)
- Receive instant notifications on bid status
- Manage active trips
- Real-time location tracking

### Bidding System
- Drivers submit price-per-seat bids
- Passengers can accept, reject, or counter
- Real-time bid status updates via WebSocket
- Automatic trip assignment on bid acceptance
- Optimistic locking prevents race conditions
- Database transactions ensure data consistency

### Trip Management
- OTP-based trip verification (6-digit code)
- Driver verifies OTP to start trip
- Real-time trip status updates
- Trip completion workflow
- Payment status tracking
- Cancellation penalties for late cancellations
- Real-time driver location tracking

### Real-Time Features
- WebSocket connections with JWT authentication (token in query param)
- Auto-reconnecting WebSocket client
- Live notifications for:
  - New ride requests (to drivers)
  - New bids (to passengers)
  - Bid status changes
  - Trip status updates
  - Driver location updates

## 🛡️ Security Features

### CORS Configuration
- Configurable allowed origins via `CORS_ALLOW_ORIGINS` environment variable
- No wildcard (`*`) origins in production
- Restricted HTTP methods and headers

### Rate Limiting
- Authentication: 5 registrations/min, 10 logins/min
- Bidding: 5 bids/min per driver
- Trip creation: 5 trips/min per passenger
- Trip cancellation: 10 cancels/min
- OTP verification: 5 attempts/min
- Health checks: 10/min

### JWT Token Security
- Tokens passed in Authorization header (REST API)
- Tokens passed as query parameter in WebSocket (prevents logging)
- Configurable expiration time

### Data Consistency
- Database transactions for multi-step operations
- Optimistic locking with version columns
- Row-level locking (`SELECT FOR UPDATE`) on critical operations
- Proper rollback on errors

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - Register new user (rate limited: 5/min)
- `POST /auth/login` - Login and receive JWT token (rate limited: 10/min)
- `GET /auth/me` - Get current user profile (rate limited: 30/min)

### Rides
- `POST /rides/request` - Create a ride request (rate limited: 5/min)
- `GET /rides/open` - List available rides (rate limited: 30/min)
- `GET /rides/my-trips` - Get user's trips (rate limited: 30/min)
- `GET /rides/driver-trips` - Get driver's trips (rate limited: 30/min)
- `POST /rides/{id}/cancel` - Cancel a ride (rate limited: 10/min)
- `POST /rides/{id}/location` - Update driver location (rate limited: 60/min)
- `GET /rides/{id}/locations` - Get location history (rate limited: 30/min)

### Bidding
- `POST /bids/{ride_id}` - Place a bid (rate limited: 5/min)
- `GET /bids/{ride_id}/all` - Get all bids for a ride (rate limited: 30/min)
- `POST /bids/{bid_id}/accept` - Accept a bid (rate limited: 10/min)
- `POST /bids/{bid_id}/counter` - Counter a bid (rate limited: 10/min)

### OTP & Trip Completion
- `POST /rides/{trip_id}/verify-otp` - Verify OTP and start ride (rate limited: 5/min)
- `POST /rides/{trip_id}/complete` - Mark trip as completed (rate limited: 5/min)

### WebSocket
- `WS /ws?token={jwt}` - Real-time connection (token as query parameter)

## 🗄️ Database Schema

Key models:
- **User**: Base user with email, password, and role
- **Driver**: Driver profile with license, rating, trip count, online status
- **Passenger**: Passenger profile with preferences (JSONB)
- **Trip**: Ride request/trip with origin, destination, pricing, version (optimistic locking)
- **TripBid**: Driver bids on trips with version tracking
- **Booking**: Trip bookings linking passengers to trips
- **Vehicle**: Driver vehicle information
- **TripLocation**: Real-time location tracking

## 🔧 Development

### Running Tests

Backend tests are organized in the `tests/` directory:

```bash
cd backend
pytest tests/ -v
```

Test coverage includes:
- Authentication (registration, login, rate limiting)
- Ride management (creation, cancellation, retrieval)
- Bidding system (place, accept, counter bids)
- OTP verification and trip completion
- WebSocket connections
- Rate limiting enforcement

### Test Structure
```
tests/
├── __init__.py
├── conftest.py          # Shared fixtures
├── test_auth.py         # Authentication tests
├── test_rides.py        # Ride management tests
├── test_bids.py         # Bidding system tests
├── test_otp.py          # OTP and completion tests
└── test_websocket.py    # WebSocket tests
```

### Code Style

- Backend: Follow PEP 8 guidelines
- Frontend: ESLint configuration included
- Type hints encouraged for all Python functions

## 📝 Environment Variables

### Backend
| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `SECRET_KEY` | JWT signing key | Required |
| `ALGORITHM` | JWT algorithm | HS256 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration | 30 |
| `CORS_ALLOW_ORIGINS` | Allowed CORS origins | http://localhost:3000 |
| `REDIS_URL` | Redis for rate limiting | Optional |
| `ENVIRONMENT` | Environment name | development |

### Frontend
| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | http://localhost:8000 |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | ws://localhost:8000 |

## 🚀 Production Deployment

1. Set strong `SECRET_KEY` (at least 32 random characters)
2. Configure `CORS_ALLOW_ORIGINS` to your actual frontend domain(s)
3. Set up Redis for distributed rate limiting
4. Use PostgreSQL with proper connection pooling
5. Enable HTTPS for WebSocket connections (wss://)
6. Set up proper logging and monitoring
7. Run database migrations with Alembic

## 📄 License

This project is private and not licensed for public use.

## 🤝 Contributing

This is a private project. If you're a team member, please follow the contribution guidelines in the team documentation.

## 📞 Support

For questions or issues, please contact the development team.
