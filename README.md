# Commuto - Real-Time Ride Sharing Platform

<div align="center">
  <h3>🚗 Share rides, split fares, travel together</h3>
  <p>A production-ready MERN stack ride-sharing platform with real-time updates, live tracking, and OTP verification.</p>
</div>

## ✨ Features

- **User Authentication** - Secure JWT-based auth with password hashing
- **Create & Join Rides** - Easily create rides or join existing ones
- **Real-Time Updates** - Live seat count and fare updates via Socket.io
- **OTP Verification** - Secure ride start with 6-digit OTP
- **Live Tracking** - Real-time vehicle location on Google Maps
- **Auto Fare Split** - Automatic fare calculation per passenger
- **Bill Generation** - Detailed billing after ride completion
- **Responsive UI** - Beautiful glassmorphism design with Tailwind CSS

## 🛠️ Tech Stack

| Frontend | Backend | Database | Real-Time |
|----------|---------|----------|-----------|
| React.js | Node.js | MongoDB | Socket.io |
| Tailwind CSS | Express.js | Mongoose | WebSocket |
| Vite | JWT Auth | | |

## 📁 Project Structure

```
Commuto/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth & validation
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── sockets/         # Socket.io handlers
│   ├── utils/           # OTP & fare utilities
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
- MongoDB (local or Atlas)
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
MONGODB_URI=mongodb://localhost:27017/commuto
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
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
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Rides
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rides` | Get all available rides |
| POST | `/api/rides` | Create new ride |
| GET | `/api/rides/:id` | Get ride details |
| POST | `/api/rides/:id/join` | Join a ride |
| POST | `/api/rides/:id/leave` | Leave a ride |
| POST | `/api/rides/:id/verify-otp` | Verify OTP & start |
| PATCH | `/api/rides/:id/location` | Update location |
| PATCH | `/api/rides/:id/complete` | Complete ride |

### Bills
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bills` | Get user's bills |
| GET | `/api/bills/:rideId` | Get bill for ride |

## 🔌 Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-ride-room` | Client → Server | Join ride room |
| `ride-updated` | Server → Client | Ride data update |
| `location-update` | Client → Server | Send location |
| `location-broadcast` | Server → Client | Receive location |

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
3. Connect repository
4. Set root directory: `backend`
5. Add environment variables
6. Deploy!

## 📝 Environment Variables

### Backend Production
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
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

- **Dashboard** - Browse and search available rides
- **Create Ride** - Form to create new rides
- **Ride Details** - View ride info, join/leave, OTP verification
- **Live Tracking** - Real-time vehicle location on map
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
  <p>Built with ❤️ using MERN Stack</p>
</div>
