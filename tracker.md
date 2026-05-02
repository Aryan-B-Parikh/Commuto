# Commuto – Project Tracker

> **Last Updated:** May 2, 2026 — Deployment doc sync + geofence/notifications + completion OTP noted  
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
Deployment           [████████████████████] 100%  (Render + Vercel + Docker + docker-compose + standalone Next.js config)
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
| Create shared ride | ✅ | `POST /rides/create-shared` — passenger or driver creates trip |
| Browse available rides (passenger) | ✅ | `GET /rides/available` |
| Open rides for bidding (driver) | ✅ | `GET /rides/open` |
| Trip details | ✅ | `GET /rides/{trip_id}/details` |
| Join shared ride | ✅ | `POST /rides/{trip_id}/join` |
| Leave shared ride | ✅ | `POST /rides/{trip_id}/leave` |
| Cancel trip | ✅ | `POST /rides/{trip_id}/cancel` with cancellation reason |
| Driver earnings breakdown | ✅ | `GET /rides/driver-earnings` (today / week / month) |
| Ride history (passenger) | ✅ | `GET /rides/my-trips` |
| Ride history (driver) | ✅ | `GET /rides/driver-trips` |

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
| Auto-reject other bids | ✅ | Other pending bids get rejected when a bid is accepted |
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
| Completion OTP generated on start | ✅ | 6-digit `Trip.completion_otp` issued after start OTP verifies |
| Trip complete endpoint | ✅ | `POST /rides/{trip_id}/complete` requires completion OTP |

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
| Trip room WebSocket | ✅ | `WS /ws/trips/{trip_id}?token=<jwt>` for per-trip updates |

### 6.2 Frontend

| Page / Component | Status | Notes |
|-----------------|--------|-------|
| `WebSocketContext.tsx` | ✅ | Global WS connection with auto-reconnect |
| `/passenger/live` — Passenger live view | ✅ | Map view during active ride |
| `/driver/live` — Driver live view | ✅ | Driver map view during trip |
| `components/map/` | ✅ | Map components (Leaflet / Mapbox / Google Maps configured) |
| Real-time location rendering on map | ✅ | Map components exist + live location WebSocket and DB fully wired |

### 6.3 Notifications & Geofence

| Feature | Status | Notes |
|---------|--------|-------|
| Notifications feed | ✅ | `GET /notifications` + mark read / clear endpoints |
| Geofence boundary | ✅ | `GET /geofence/boundary` returns GeoJSON polygon |

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
| List payment methods | ✅ | `GET /auth/payment-methods` |
| Add payment method | ✅ | `POST /auth/payment-methods` |
| Set default payment method | ✅ | `PATCH /auth/payment-methods/{id}/default` |
| Delete payment method | ✅ | `DELETE /auth/payment-methods/{id}` |
| Trip payment order | ✅ | `POST /rides/{trip_id}/pay-order` |
| Verify trip payment | ✅ | `POST /rides/verify-trip-payment` |
| Auto-bill on ride completion | ✅ | Wallet deduction + `Transaction` record created for each passenger on `complete_ride` |
| Bill/receipt download | ✅ | `GET /rides/{trip_id}/receipt` endpoint returns full receipt JSON; UI shown in passenger/trip/[id] |
| Driver rating | ✅ | `POST /rides/{trip_id}/rate-driver` + rolling average on Driver model + star rating UI in receipt |
| Wallet transfer | ✅ | `POST /wallet/transfer` to send funds by email |

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
- **Trip completion OTP** — generated after start OTP, required to complete ride
- **Trip room WebSocket** — `WS /ws/trips/{trip_id}` with per-trip live updates
- **Notifications API** — persistent feed with mark read and clear endpoints
- **Geofence boundary endpoint** — `GET /geofence/boundary` for map overlays
- **Trip payment order endpoints** — `POST /rides/{trip_id}/pay-order` + `/rides/verify-trip-payment`
- **Wallet transfers** — `POST /wallet/transfer` to send funds by email
- Rider and driver dashboards, profile, earnings, history
- Map integration (Leaflet + Mapbox + Google Maps)
- Rate limiting and optimistic locking for concurrency safety
- Comprehensive backend test suite
- **Playwright E2E test suite** — `auth.spec.ts`, `rides.spec.ts`, `bids.spec.ts`, `otp.spec.ts`, `wallet.spec.ts`; run via `npm run test:e2e`
- **Docker deployment**: `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml`

### 🔶 Partially Done / Needs Verification
- Safety infrastructure: SOS button, route deviation alerts, shareable trip links, mandatory emergency contacts
- Identity and trust: student ID verification, driver selfie checks, vehicle document verification, gender preference
- Communication privacy: masked phone numbers and in-app chat
- Auto-rickshaw operations: license plate visualization, seat availability, fare splitting, scheduled rides
- Community trust: detailed ratings, favorite drivers, college badges

### ❌ Not Yet Implemented
- Admin panel (optional per spec)

---

## 12. Planned Enhancements (Safety, Trust, Operations)

### Safety Infrastructure (Critical)
- SOS endpoint to notify campus security and emergency contacts with live location
- Route deviation detection against expected route (alert if deviation exceeds 500m)
- Shareable trip tracking link without login
- Emergency contacts required during onboarding

### Identity Verification and Trust
- Student email domain restriction (@charusat.edu.in) or student ID upload workflow
- Driver selfie verification before each trip
- Vehicle document verification (registration, insurance, driver license)
- Gender preference option for riders

### Communication Privacy
- Masked phone numbers via Twilio or Vonage
- In-app chat between passenger and driver

### Auto-Rickshaw Operations
- License plate visualization in Gujarat RTO format (for example, GJ-23-XX-0000)
- Seat availability based on fixed capacity (3-4 passengers)
- Fare splitting among co-passengers
- Scheduled rides with a scheduled_at field for advance bookings

### Community Features
- Detailed ratings (on time, safe driving, clean vehicle)
- Favorite or repeat driver preference
- College community badges on profiles

### Suggested Data Models
- emergency_contacts (user_id, name, phone, relationship, is_primary)
- safety_events (trip_id, type [sos|deviation|alert], location, resolved_at)
- student_verifications (user_id, college_email, student_id_image, status, verified_at)
- trip_schedules (trip_id, scheduled_at, recurrence_pattern)

### Suggested WebSocket Events
- sos_triggered
- route_deviation_alert
- trip_shared
