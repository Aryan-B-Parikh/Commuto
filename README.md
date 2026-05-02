# Commuto - Ride-Sharing Platform

A modern ride-sharing/carpool application with a bidding-based matching system. Passengers post ride requests, drivers place bids, and passengers can accept or counter-offer to find the best match.

## 🏗️ Architecture

This is a monorepo containing:

- **Backend**: FastAPI REST API + WebSocket server
- **Frontend**: Next.js 16 (App Router) React application

## 🚀 Tech Stack

### Backend
- **Framework**: FastAPI 0.115.0
- **Database**: Local PostgreSQL
- **ORM**: SQLAlchemy 2.0
- **Auth**: JWT tokens (python-jose) with bcrypt password hashing
- **Rate Limiting**: SlowAPI with Redis support
- **Real-time**: WebSocket support for live updates
- **Email**: SMTP + EmailJS (optional)
- **SMS**: Twilio OTP (optional)
- **Payments**: Razorpay wallet top-ups + ledgered transactions
- **Notifications**: Persistent notifications + WebSocket fanout

### Frontend
- **Framework**: Next.js 16 with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **HTTP Client**: Axios
- **Maps**: Leaflet + React-Leaflet (Ola/Google keys supported)
- **Animations**: Framer Motion
- **Testing**: Playwright E2E

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
- Local PostgreSQL database
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

4. Create a `.env` file in the `backend/` directory (see `backend/.env.example`; `render.env` shows production-style keys):
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/commuto
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

3. Create a `.env.local` file in the `frontend/` directory (see `vercel.env` for production templates):
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
- Email verification (SMTP/EmailJS; dev-mode tokens for local testing)
- Phone OTP verification (Twilio; dev-mode OTP for local testing)
- Google OAuth sign-in for passenger and driver
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
- Completion OTP required to finish rides
- Real-time trip status updates
- Trip completion workflow
- Payment status tracking
- Trip receipts and driver rating after completion
- Cancellation penalties for late cancellations
- Real-time driver location tracking

### Real-Time Features
- WebSocket connections with JWT authentication (token in query param)
- Auto-reconnecting WebSocket client
- Per-trip WebSocket rooms for live location and status updates
- Live notifications for:
  - New ride requests (to drivers)
  - New bids (to passengers)
  - Bid status changes
  - Trip status updates
  - Driver location updates

### Wallet & Payments
- Razorpay wallet top-ups
- Auto-collection on trip completion
- Trip receipts with rating flow
- Wallet transfers between users

### Notifications & Geofence
- Persistent notification feed with read/unread controls
- Service-area geofence boundary endpoint for map overlays

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

## 📡 API Endpoints (Selected)

### Authentication & Profile
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and receive JWT token
- `POST /auth/send-verification` - Email verification token
- `POST /auth/verify-email` - Verify email token
- `POST /auth/send-phone-verification` - Phone OTP request
- `POST /auth/verify-phone` - Verify phone OTP
- `POST /auth/google` - Google OAuth sign-in
- `GET /auth/me` - Get current user profile
- `PATCH /auth/me` - Update current user profile

### Rides & Trips
- `POST /rides/create-shared` - Create a shared ride request
- `GET /rides/available` - Browse available shared rides
- `GET /rides/open` - Open rides for drivers to bid on
- `GET /rides/{trip_id}/details` - Trip details with passengers
- `POST /rides/{trip_id}/join` - Join a shared ride
- `POST /rides/{trip_id}/leave` - Leave a shared ride
- `GET /rides/my-trips` - Passenger trip history
- `GET /rides/driver-trips` - Driver trip history
- `GET /rides/driver-earnings` - Driver earnings breakdown
- `POST /rides/{trip_id}/cancel` - Cancel a trip
- `POST /rides/{trip_id}/location` - Update driver location
- `GET /rides/{trip_id}/locations` - Location history
- `POST /rides/{trip_id}/verify-otp` - Verify start OTP
- `POST /rides/{trip_id}/complete` - Complete trip (requires completion OTP)
- `POST /rides/{trip_id}/pay-order` - Create Razorpay trip order
- `POST /rides/verify-trip-payment` - Verify trip payment
- `GET /rides/{trip_id}/receipt` - Trip receipt
- `POST /rides/{trip_id}/rate-driver` - Rate driver

### Bidding
- `POST /bids/{ride_id}` - Place a bid
- `GET /bids/{ride_id}/all` - Get all bids for a ride
- `GET /bids/my-bids` - Driver bids list
- `POST /bids/{bid_id}/accept` - Accept a bid
- `POST /bids/{bid_id}/counter` - Counter a bid

### Wallet & Payments
- `GET /wallet` - Wallet balance
- `GET /wallet/transactions` - Wallet transactions
- `POST /wallet/add-money` - Create Razorpay wallet order
- `POST /wallet/verify-payment` - Verify wallet payment
- `POST /wallet/pay` - Pay from wallet balance
- `POST /wallet/transfer` - Transfer wallet funds
- `GET /auth/payment-methods` - List payment methods
- `POST /auth/payment-methods` - Add payment method
- `PATCH /auth/payment-methods/{id}/default` - Set default payment method
- `DELETE /auth/payment-methods/{id}` - Delete payment method

### Notifications & Geofence
- `GET /notifications` - List notifications
- `POST /notifications/{notification_id}/read` - Mark notification as read
- `POST /notifications/read-all` - Mark all notifications as read
- `DELETE /notifications` - Clear notifications
- `GET /geofence/boundary` - Service-area boundary GeoJSON

### WebSocket
- `WS /ws?token={jwt}` - Real-time connection
- `WS /ws/trips/{trip_id}?token={jwt}` - Trip room updates

### Health
- `GET /health` - API health check

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

For a direct terminal end-to-end validation of critical user flows (identity, marketplace, OTP/tracking, wallet checks), run:

```bash
python scripts/verification/verify_master_flow.py
```

Optional flags:

```bash
python scripts/verification/verify_master_flow.py --base-url http://127.0.0.1:8000 --ws-url ws://127.0.0.1:8000 --timeout 20 --auth-delay 1.2
```

Other manual checks live in [scripts/verification](scripts/verification) and [backend/tests/manual](backend/tests/manual).

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
| `FRONTEND_URL` | Frontend base URL (email links) | http://localhost:3000 |
| `APP_ENV` | Environment name | development |
| `SMTP_HOST` | SMTP host for email | Optional |
| `SMTP_PORT` | SMTP port | Optional |
| `SMTP_USER` | SMTP username | Optional |
| `SMTP_PASS` | SMTP password | Optional |
| `EMAILJS_SERVICE_ID` | EmailJS service ID | Optional |
| `EMAILJS_TEMPLATE_ID` | EmailJS template ID | Optional |
| `EMAILJS_PUBLIC_KEY` | EmailJS public key | Optional |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | Optional |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | Optional |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | Optional |
| `RAZORPAY_KEY_ID` | Razorpay key ID | Optional |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret | Optional |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Optional |
| `REDIS_URL` | Redis for rate limiting | Optional |
| `ENVIRONMENT` | Environment name | development |

### Frontend
| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | http://localhost:8000 |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | ws://localhost:8000 |
| `NEXT_PUBLIC_OLA_MAPS_API_KEY` | Ola Maps key | Optional |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps key | Optional |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID | Optional |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay public key | Optional |

## 🚀 Deployment

- Hosted setup (recommended): Render (backend + PostgreSQL) + Vercel (frontend). See [DEPLOYMENT.md](DEPLOYMENT.md) and use `render.env` / `vercel.env` as templates.
- Local orchestration: `docker-compose.yml` for backend + frontend + database.

### Production Hardening Checklist

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
