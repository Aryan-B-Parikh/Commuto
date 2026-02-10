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

4. Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database
   SECRET_KEY=your-secret-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
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

### Ride Requests (Passenger Flow)
- Create ride requests with origin/destination
- Set preferred departure time
- Specify number of seats needed
- View all incoming bids from drivers
- Accept or counter-offer bids
- Cancel pending requests

### Driver Marketplace
- Browse open ride requests
- Filter by location and time
- Place competitive bids
- Receive instant notifications on bid status
- Manage active trips

### Bidding System
- Drivers submit price-per-seat bids
- Passengers can accept, reject, or counter
- Real-time bid status updates via WebSocket
- Automatic trip assignment on bid acceptance

### Trip Management
- OTP-based trip verification (6-digit code)
- Driver verifies OTP to start trip
- Real-time trip status updates
- Trip completion workflow
- Payment status tracking

### Real-Time Features
- WebSocket connections with JWT authentication
- Live notifications for:
  - New ride requests (to drivers)
  - New bids (to passengers)
  - Bid status changes
  - Trip status updates
- Auto-reconnecting WebSocket client

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and receive JWT token
- `GET /auth/me` - Get current user profile

### Rides
- `POST /rides/request` - Create a ride request (passenger)
- `GET /rides/open` - List available rides (driver)
- `GET /rides/my-trips` - Get user's trips
- `POST /rides/{id}/cancel` - Cancel a ride

### Bidding
- `POST /bids/{ride_id}` - Place a bid (driver)
- `GET /bids/{ride_id}/all` - Get all bids for a ride (passenger)
- `POST /bids/{bid_id}/accept` - Accept a bid (passenger)
- `POST /bids/{bid_id}/counter` - Counter a bid

### OTP & Trip Completion
- `POST /rides/{trip_id}/verify-otp` - Verify OTP and start ride
- `POST /rides/{trip_id}/complete` - Mark trip as completed

### WebSocket
- `WS /ws/{token}` - Real-time connection (JWT token in URL)

## 🗄️ Database Schema

Key models:
- **User**: Base user with email, password, and role
- **Driver**: Driver profile with license, rating, and vehicle info
- **Passenger**: Passenger profile with preferences
- **Trip**: Ride request/trip with origin, destination, and pricing
- **TripBid**: Driver bids on trips
- **Booking**: Trip bookings linking passengers to trips
- **Vehicle**: Driver vehicle information

## 🔧 Development

### Running Tests

Backend:
```bash
cd backend
python -m pytest
```

Frontend:
```bash
cd frontend
npm run lint
npm run build  # Check for build errors
```

### Code Style

- Backend: Follow PEP 8 guidelines
- Frontend: ESLint configuration included

## 📝 License

This project is private and not licensed for public use.

## 🤝 Contributing

This is a private project. If you're a team member, please follow the contribution guidelines in the team documentation.

## 📞 Support

For questions or issues, please contact the development team.
