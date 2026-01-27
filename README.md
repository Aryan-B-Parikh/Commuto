# Commuto - Real-Time Ride-Hailing Platform

<div align="center">
  <h3>🚗 Request rides, negotiate fares, track in real-time</h3>
  <p>A production-ready ride-hailing platform with bidding system, live tracking, and OTP verification.</p>
</div>

## ✨ Features

- **Role-Based Users** - Separate Rider and Driver registration
- **Ride Requests** - Riders create requests, drivers bid on them
- **Bidding System** - Drivers submit bids, riders can counter-offer or accept
- **Direct Booking** - Option to book a specific online driver
- **OTP Verification** - Secure ride start with 6-digit OTP
- **Live Tracking** - Real-time vehicle location on Google Maps
- **Bill Generation** - Automatic billing after ride completion
- **Real-Time Updates** - Live notifications via Socket.io
- **Responsive UI** - Beautiful glassmorphism design with Tailwind CSS

## 🛠️ Tech Stack

| Frontend | Backend | Database | Real-Time |
|----------|---------|----------|-----------|
| React.js | Node.js | PostgreSQL | Socket.io |
| Tailwind CSS | Express.js | Prisma ORM | WebSocket |
| Vite | JWT Auth | | |

## 📁 Project Structure

```
Commuto/
├── backend/
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth & role middleware
│   ├── prisma/          # Prisma schema & migrations
│   ├── routes/          # API routes
│   ├── sockets/         # Socket.io handlers
│   ├── utils/           # OTP, fare, Prisma utilities
│   ├── server.js        # Entry point
│   └── .env             # Environment variables
│
└── frontend/
    ├── src/
    │   ├── components/  # Reusable UI components
    │   ├── context/     # Auth & Socket contexts
    │   ├── pages/       # Page components
    │   ├── services/    # API configuration
    │   └── App.jsx      # Main app component
    └── .env             # Frontend env variables
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.x
- PostgreSQL (local or cloud like Supabase/Neon)
- Google Maps API Key (optional, for live tracking)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Commuto.git
cd Commuto
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/commuto?schema=public
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Initialize database:
```bash
npx prisma db push
npx prisma generate
```

Start backend:
```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` file:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

Start frontend:
```bash
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register-rider` | Register as rider |
| POST | `/api/auth/register-driver` | Register as driver |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/driver-status` | Toggle driver online/offline |
| GET | `/api/auth/drivers/online` | Get online drivers |

### Rides
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rides/request` | Create ride request (Rider) |
| GET | `/api/rides/available` | Get available requests (Driver) |
| GET | `/api/rides/:id` | Get ride details |
| GET | `/api/rides/my-rides` | Get user's ride history |
| POST | `/api/rides/:id/bid` | Submit bid (Driver) |
| POST | `/api/rides/:id/counter` | Counter-offer (Rider) |
| POST | `/api/rides/:id/accept-bid` | Accept bid (Rider) |
| POST | `/api/rides/:id/reject-bid` | Reject bid (Rider) |
| POST | `/api/rides/:id/start` | Start ride with OTP (Driver) |
| PATCH | `/api/rides/:id/location` | Update location (Driver) |
| POST | `/api/rides/:id/complete` | Complete ride (Driver) |
| POST | `/api/rides/:id/cancel` | Cancel ride |

### Bills
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bills/history` | Get user's bills |
| GET | `/api/bills/:rideId` | Get bill for ride |

## 🔌 Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `driver-online` | Client → Server | Driver goes online |
| `driver-offline` | Client → Server | Driver goes offline |
| `new-ride-request` | Server → Driver | New ride available |
| `direct-ride-request` | Server → Driver | Direct booking request |
| `submit-bid` | Client → Server | Driver submits bid |
| `receive-bid` | Server → Rider | Rider receives bid |
| `bid-accepted` | Server → Driver | Bid was accepted |
| `location-update` | Client → Server | Send location |
| `location-broadcast` | Server → Client | Receive location |

## 🔄 Ride Flow

1. **Rider** logs in and creates a ride request
2. **Drivers** (online) receive notification of new request
3. **Driver** submits a bid with offered fare
4. **Rider** sees incoming bids, can counter-offer or accept
5. **Rider** accepts bid → OTP generated and shown to Rider
6. **Driver** enters OTP to start the ride
7. **Driver** location is tracked in real-time
8. **Driver** completes ride → Bill generated for both

## 🚢 Deployment

### Frontend (Vercel)

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Set root directory: `frontend`
4. Add environment variables
5. Deploy!

### Backend (Railway)

1. Push to GitHub
2. Create project on [Railway](https://railway.app)
3. Add PostgreSQL database
4. Connect repository
5. Set root directory: `backend`
6. Add environment variables
7. Deploy!

## 📝 Environment Variables

### Backend Production
```env
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=your-production-secret
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend Production
```env
VITE_API_URL=https://your-backend.railway.app
VITE_SOCKET_URL=https://your-backend.railway.app
VITE_GOOGLE_MAPS_API_KEY=your-api-key
```

## 🎨 Screenshots

The application features a modern dark theme with glassmorphism effects:

- **Rider Dashboard** - Create ride requests, view incoming bids
- **Driver Dashboard** - Go online, see requests, submit bids
- **Ride Details** - OTP verification, live tracking
- **Bill Summary** - Detailed fare breakdown after ride

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project!

---

<div align="center">
  <p>Built with ❤️ using Node.js, React, PostgreSQL & Socket.io</p>
</div>
