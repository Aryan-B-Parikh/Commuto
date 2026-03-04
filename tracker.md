# Commuto – Project Tracker

> **Last Updated:** March 4, 2026 — KrishDemo Google Auth merged  
> **Branch:** Aryan  
> **Stack:** FastAPI + PostgreSQL + Next.js 16 (TypeScript)

---

## Overall Progress

```
Frontend UI          [████████████████████] 100%  (all pages + counter-bid UI + receipt + rating done)
API Routes           [████████████████████] 100%  (all endpoints incl. receipt + rate-driver complete)
Database / Models    [████████████████████] 100%  (all models including wallet deduction wired up)
Auth                 [████████████████████] 100%  (JWT + bcrypt + roles + email + SMS + Google OAuth complete)
WebSocket / Realtime [████████████████████] 100%  (infra + bid notify + live location fully wired)
Billing / Payments   [████████████████████] 100%  (wallet + Razorpay + auto-deduct on complete done)
OTP Verification     [████████████████████] 100%  (backend + passenger OTP display (mobile+desktop) done)
Bidding              [████████████████████] 100%  (full bid + counter-bid backend + frontend done)
Testing              [████████████████████] 100%  (backend suite done + Playwright E2E suite added)
Deployment           [████████████████████] 100%  (Docker + docker-compose + standalone Next.js config)
```

**Total Estimated Completion: 100%**

---

## Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented |
| 🔶 | Partially implemented |
| ❌ | Not yet implemented |

---

## 1. User Authentication & Registration

### 1.1 Backend (`backend/routers/auth_router.py`, `backend/auth.py`)

| Feature | Status | Notes |
|---------|--------|-------|
| User registration (passenger) | ✅ | `POST /auth/register` — creates User + Passenger profile |
| User registration (driver) | ✅ | `POST /auth/register` — creates User + Driver profile + optional Vehicle |
| Role validation (passenger / driver) | ✅ | Enforced at registration |
| Password hashing (bcrypt) | ✅ | Implemented in `auth.py` |
| User login | ✅ | `POST /auth/login` — returns JWT access token |
| JWT authentication | ✅ | Stateless JWT with role embedded in token |
| Token-protected routes | ✅ | `auth.get_current_user`, `auth.require_role()` Depends |
| Rate limiting on auth routes | ✅ | 5 register/min, enforced via `rate_limiter.py` |
| Profile update endpoint | ✅ | `PATCH /auth/profile` |
| Email uniqueness check | ✅ | Returns 400 if email already registered |
| Account email verification | ✅ | `POST /auth/send-verification` + `POST /auth/verify-email`; SMTP optional (dev mode returns token directly) |
| Phone OTP verification (signup) | ✅ | `POST /auth/send-phone-verification` + `POST /auth/verify-phone`; Twilio optional (dev mode returns OTP directly) |
| Google OAuth sign-in | ✅ | `POST /auth/google` — verifies Google ID token, creates user if new, returns JWT; supports passenger / driver role selection |

### 1.2 Frontend (`frontend/src/app/`)

| Page / Component | Status | Notes |
|-----------------|--------|-------|
| `/login` page | ✅ | Login form with JWT storage |
| `/signup` page | ✅ | Registration form for both roles |
| `/select-role` page | ✅ | Role picker (passenger / driver) |
| `/verify-email` — Email verification | ✅ | Token entry + auto-verify from URL param + Resend button + dev-mode token display |
| `/verify-phone` — Phone OTP verification | ✅ | 6-digit OTP entry; dev-mode OTP shown inline; chained from `/verify-email` |
| `/verify-otp` page | ✅ | OTP input UI (post-login OTP step) |
| Google login button (signup / login) | ✅ | `@react-oauth/google` `<GoogleLogin>` component; calls `googleLogin()` in `AuthContext` |
| `AuthContext.tsx` | ✅ | Global auth state management including `googleLogin()` action |
| `useAuth.ts` hook | ✅ | Hook for auth actions |

---

## 2. Database Models (`backend/models.py`)

| Model | Status | Notes |
|-------|--------|-------|
| `User` | ✅ | UUID PK, role, profile fields, emergency contact (JSON) |
| `Driver` | ✅ | License, insurance, rating, total_trips, is_online |
| `Passenger` | ✅ | Preferences (JSON), accessibility_needs |
| `Vehicle` | ✅ | make, model, year, plate_number, capacity, color |
| `Trip` | ✅ | Full lifecycle: origin/dest coords, OTP, seats, status, cancellation, payment |
| `TripPassenger` | ✅ | Association table for shared rides |
| `Booking` | ✅ | Per-passenger booking with price and OTP flag |
| `TripBid` | ✅ | Bid amount, status, counter-bid support (parent_bid_id) |
| `TripLocation` | ✅ | Historical location log per trip |
| `LiveLocation` | ✅ | Latest live location per trip (single row per trip) |
| `SavedPlace` | ✅ | Saved pickup/drop-off locations per user |
| `PaymentMethod` | ✅ | Card/UPI/netbanking, Razorpay token |
| `Wallet` | ✅ | Balance per user |
| `Transaction` | ✅ | Credit/payment/refund history with Razorpay IDs |
| `Bill` (separate model) | ❌ | No dedicated Bill model — billing tracked via Trip payment fields |

---

## 3. Ride Request

### 3.1 Backend (`backend/routers/rides_router.py`)

| Feature | Status | Notes |
|---------|--------|-------|
| Create ride/trip request | ✅ | `POST /rides/` — passenger creates trip with origin, dest, seats, time |
| List available rides (driver view) | ✅ | `GET /rides/available` |
| Get ride details | ✅ | `GET /rides/{trip_id}` |
| Cancel trip | ✅ | `POST /rides/{trip_id}/cancel` with cancellation reason |
| Driver earnings breakdown | ✅ | `GET /rides/driver-earnings` (today / week / month) |
| Ride history (passenger) | ✅ | Endpoint for completed/past trips |
| Ride history (driver) | ✅ | Filtered by driver_id |

### 3.2 Frontend

| Page / Component | Status | Notes |
|-----------------|--------|-------|
| `/passenger/search` — Search rides | ✅ | Search/browse available trips |
| `/passenger/ride-details` — Ride detail view | ✅ | Shows trip info and bids |
| `/passenger/history` — Trip history | ✅ | Past rides list |
| `/passenger/boarding` — Boarding screen | ✅ | Pre-ride boarding UI |
| `/driver/create` — Create a trip | ✅ | Driver posts a new trip |
| `/driver/requests` — View ride requests | ✅ | Incoming passenger requests |
| `/driver/history` — Trip history | ✅ | Past completed trips |

---

## 4. Driver Bidding

### 4.1 Backend (`backend/routers/bids_router.py`)

| Feature | Status | Notes |
|---------|--------|-------|
| Place a bid | ✅ | `POST /bids/` — driver submits bid on a trip |
| View all my bids (driver) | ✅ | `GET /bids/my-bids` with trip details + passenger notes |
| View bids on a trip (passenger) | ✅ | `GET /bids/trip/{trip_id}` |
| Accept a bid | ✅ | `POST /bids/{bid_id}/accept` — assigns driver to trip, generates OTP |
| Reject a bid | ✅ | `POST /bids/{bid_id}/reject` |
| Counter bid | ✅ | DB model + `POST /bids/{bid_id}/counter` endpoint + frontend Counter button (both mobile & desktop) |
| Optimistic locking on bids | ✅ | `version` column on `TripBid` |

### 4.2 Frontend

| Page / Component | Status | Notes |
|-----------------|--------|-------|
| Bid list on ride detail page | ✅ | Passenger sees all driver bids |
| Accept/reject bid buttons | ✅ | `components/ride/` |
| Counter-bid UI | ✅ | Counter button + inline amount input in both `passenger/trip/[id]` and `passenger/ride-details/[id]` |

---

## 5. OTP Verification

### 5.1 Backend (`backend/routers/otp_router.py`)

| Feature | Status | Notes |
|---------|--------|-------|
| OTP generated on bid accept | ✅ | 6-digit OTP stored in `Trip.start_otp` |
| OTP verify endpoint | ✅ | `POST /rides/{trip_id}/verify-otp` — driver role only |
| OTP rate limiting | ✅ | 5 attempts per minute |
| OTP already-verified guard | ✅ | Returns 400 if already verified |
| Trip status → ACTIVE after OTP | ✅ | Trip transitions to `active` on success |
| Trip complete endpoint | ✅ | `POST /rides/{trip_id}/complete` |

### 5.2 Frontend

| Page / Component | Status | Notes |
|-----------------|--------|-------|
| `/verify-otp` OTP input page | ✅ | OTP entry form |
| OTP display for passenger | ✅ | OTP shown on desktop AND mobile (sticky bottom bar in ride-details) |
| OTP entry for driver | ✅ | `VerifyOTPModal` wired in driver live page |

---

## 6. Real-Time WebSocket & Live Tracking

### 6.1 Backend (`backend/routers/websocket_router.py`, `backend/websocket_manager.py`)

| Feature | Status | Notes |
|---------|--------|-------|
| WebSocket endpoint | ✅ | `WS /ws?token=<jwt>` — JWT-authenticated |
| Role-based connection routing | ✅ | Drivers and passengers tracked separately |
| Notify drivers of new ride request | ✅ | `type: new_ride_request` broadcast |
| Notify passenger of new bid | ✅ | `type: new_bid` personal message |
| Ping/pong keepalive | ✅ | Handled in receive loop |
| Live location update endpoint | ✅ | `POST /rides/{trip_id}/location` — stores in `LiveLocation` + `TripLocation` |
| Location stored in DB | ✅ | Both `live_locations` (latest) and `trip_locations` (history) |
| Broadcast location to passenger | ✅ | Location saved to DB + WebSocket broadcast via `manager.send_personal_message` |
| Trip status change notifications | ✅ | Bid acceptance, trip start (OTP verify), and completion broadcast to passengers |

### 6.2 Frontend

| Page / Component | Status | Notes |
|-----------------|--------|-------|
| `WebSocketContext.tsx` | ✅ | Global WS connection with auto-reconnect |
| `/passenger/live` — Passenger live view | ✅ | Map view during active ride |
| `/driver/live` — Driver live view | ✅ | Driver map view during trip |
| `components/map/` | ✅ | Map components (Leaflet / Mapbox / Google Maps configured) |
| Real-time location rendering on map | ✅ | Map components exist + live location WebSocket and DB fully wired |

---

## 7. Billing & Payments

### 7.1 Backend (`backend/routers/wallet_router.py`, `backend/routers/payment_methods_router.py`)

| Feature | Status | Notes |
|---------|--------|-------|
| Wallet per user | ✅ | Auto-created on first access |
| Check wallet balance | ✅ | `GET /wallet` |
| Transaction history | ✅ | `GET /wallet/transactions` |
| Add money to wallet (Razorpay) | ✅ | `POST /wallet/add-money` creates Razorpay order |
| Verify Razorpay payment | ✅ | `POST /wallet/verify-payment` with HMAC signature check |
| List payment methods | ✅ | `GET /payment-methods` |
| Add payment method | ✅ | `POST /payment-methods` |
| Set default payment method | ✅ | `PATCH /payment-methods/{id}/default` |
| Delete payment method | ✅ | `DELETE /payment-methods/{id}` |
| Auto-bill on ride completion | ✅ | Wallet deduction + `Transaction` record created for each passenger on `complete_ride` |
| Bill/receipt download | ✅ | `GET /rides/{trip_id}/receipt` endpoint returns full receipt JSON; UI shown in passenger/trip/[id] |
| Driver rating | ✅ | `POST /rides/{trip_id}/rate-driver` + rolling average on Driver model + star rating UI in receipt |

### 7.2 Frontend

| Page / Component | Status | Notes |
|-----------------|--------|-------|
| `/passenger/wallet` — Wallet page | ✅ | Balance, transactions, add money |
| `components/wallet/` | ✅ | Wallet UI components |
| Post-ride bill screen | ✅ | Receipt card + driver star rating in `passenger/trip/[id]` for completed trips |

---

## 8. Dashboards & Profiles

| Page | Status | Notes |
|------|--------|-------|
| `/passenger/dashboard` | ✅ | Passenger home/dashboard |
| `/driver/dashboard` | ✅ | Driver home/dashboard |
| `/driver/earnings` | ✅ | Earnings breakdown (today/week/month) |
| `/profile` | ✅ | View/edit user profile |
| `components/profile/` | ✅ | Profile-related UI components |
| `/passenger/ride-sharing` | ✅ | Shared commute feature page |
| Admin panel | ❌ | Not implemented (optional in spec) |

---

## 9. Non-Functional Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| Password encryption (bcrypt) | ✅ | Enforced in `auth.py` |
| JWT authentication | ✅ | All protected routes use JWT |
| Rate limiting | ✅ | `rate_limiter.py` applied on all sensitive endpoints |
| Concurrent ride request handling | ✅ | Optimistic locking (`version` columns on Trip and TripBid) |
| Real-time communication | ✅ | WebSocket via `websocket_manager.py` |
| Data consistency (DB) | ✅ | PostgreSQL + SQLAlchemy with `with_for_update()` locks |
| CORS configuration | ✅ | Configured in `main.py` |

---

## 10. Testing

| Test Suite | Status | Notes |
|------------|--------|-------|
| Auth tests (`tests/test_auth.py`) | ✅ | Registration, login flows |
| Ride tests (`tests/test_rides.py`) | ✅ | Trip CRUD |
| Bid tests (`tests/test_bids.py`) | ✅ | Bid placement and acceptance |
| OTP tests (`tests/test_otp.py`) | ✅ | OTP verify flow |
| WebSocket tests (`tests/test_websocket.py`) | ✅ | WS connection tests |
| Frontend unit tests | ✅ | Playwright E2E suite: `tests/e2e/auth.spec.ts`, `rides.spec.ts`, `bids.spec.ts`, `otp.spec.ts`, `wallet.spec.ts` |
| E2E tests | ✅ | Playwright configured (`playwright.config.ts`); run with `npm run test:e2e` |
| Legacy test scripts | 🔶 | Several scripts in `backend/tests/legacy/` and root — for manual verification |

---

## 11. Summary

### ✅ What's Done
- Full user registration/login with role-based JWT auth
- Trip/ride lifecycle: create → bid → accept → OTP verify → active → complete
- **Counter-bid support end-to-end**: DB, API (`POST /bids/{id}/counter`), and frontend UI (mobile + desktop)
- Real-time WebSocket infrastructure for bid, ride notifications, and live location broadcast
- Live location storage and tracking endpoints
- Full wallet system with Razorpay integration
- **Auto-deduct from wallet on trip completion** with `Transaction` ledger entry per passenger
- **`GET /rides/{trip_id}/receipt`** endpoint + receipt card with driver star rating UI
- **Driver rating** — rolling average endpoint + 5-star UI in the post-ride receipt
- **Mobile OTP display** for passenger in sticky bottom bar (shared with driver at pickup)
- **Email verification** — `POST /auth/send-verification` + `POST /auth/verify-email`; SMTP optional; dev mode returns token + URL inline; `/verify-email` page with auto-verify from URL param
- **SMS / phone verification** — `POST /auth/send-phone-verification` + `POST /auth/verify-phone`; Twilio optional; dev mode returns OTP inline; `/verify-phone` page
- **Google OAuth sign-in** — `POST /auth/google` backend endpoint; `<GoogleLogin>` button on signup + login pages; `ThemeProvider` + `GoogleOAuthProvider` wired into root layout
- Rider and driver dashboards, profile, earnings, history
- Map integration (Leaflet + Mapbox + Google Maps)
- Rate limiting and optimistic locking for concurrency safety
- Comprehensive backend test suite
- **Playwright E2E test suite** — `auth.spec.ts`, `rides.spec.ts`, `bids.spec.ts`, `otp.spec.ts`, `wallet.spec.ts`; run via `npm run test:e2e`
- **Docker deployment**: `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml`

### 🔶 Partially Done / Needs Verification
- None

### ❌ Not Yet Implemented
- Admin panel (optional per spec)
