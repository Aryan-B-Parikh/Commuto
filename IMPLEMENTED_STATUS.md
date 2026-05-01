# Commuto Implementation Status

Last updated: 2026-04-09 (source: tracker.md)

## Overall Progress
- Frontend UI: 100% (all pages, counter-bid UI, receipt, rating)
- API routes: 100% (all endpoints including receipt and rate-driver)
- Database/models: 100% (all models including wallet deduction wiring)
- Auth: 100% (JWT, bcrypt, roles, email, SMS, Google OAuth)
- WebSocket/realtime: 100% (bid notify and live location)
- Billing/payments: 100% (wallet, Razorpay, auto-deduct)
- OTP verification: 100% (backend + passenger OTP display on mobile and desktop)
- Testing: 100% (backend suite + Playwright E2E suite)
- Deployment: 100% (Docker + docker-compose + standalone Next.js config)

## 1. Authentication and Registration

### Backend (backend/routers/auth_router.py, backend/auth.py)
- User registration (passenger): POST /auth/register creates User + Passenger
- User registration (driver): POST /auth/register creates User + Driver + optional Vehicle
- Role validation enforced at registration
- Password hashing with bcrypt
- User login: POST /auth/login returns JWT access token
- JWT auth with role embedded in token
- Token-protected routes: auth.get_current_user, auth.require_role()
- Rate limiting on auth routes (5 register/min)
- Profile update: PATCH /auth/profile
- Email uniqueness check returns 400 if already registered
- Account email verification: POST /auth/send-verification + POST /auth/verify-email
- Phone OTP verification: POST /auth/send-phone-verification + POST /auth/verify-phone
- Google OAuth sign-in: POST /auth/google (verifies Google ID token, creates user if new)

### Frontend (frontend/src/app)
- /login page with JWT storage
- /signup page for both roles
- /select-role page for passenger/driver
- /verify-email page with token entry, auto-verify from URL, resend, dev-mode token display
- /verify-phone page with 6-digit OTP entry and dev-mode OTP display
- /verify-otp page for post-login OTP
- Google login button on signup/login via @react-oauth/google
- AuthContext.tsx includes googleLogin action

## 2. Database Models (backend/models.py)
- User: UUID PK, role, profile fields, emergency contact JSON
- Driver: license, insurance, rating, total_trips, is_online
- Passenger: preferences JSON, accessibility_needs
- Vehicle: make, model, year, plate_number, capacity, color
- Trip: full lifecycle (origin/dest coords, OTP, seats, status, cancellation, payment)
- TripPassenger: association table for shared rides
- Booking: per-passenger booking with price and OTP flag
- TripBid: bid amount, status, counter-bid support (parent_bid_id)
- TripLocation: historical location log per trip
- LiveLocation: latest live location per trip (single row per trip)
- SavedPlace: saved pickup/drop-off locations per user
- PaymentMethod: card/UPI/netbanking with Razorpay token
- Wallet: balance per user
- Transaction: credit/payment/refund history with Razorpay IDs
- Bill model: not implemented (billing tracked via Trip payment fields)

## 3. Ride Request

### Backend (backend/routers/rides_router.py)
- Create ride/trip request: POST /rides/
- List available rides (driver view): GET /rides/available
- Ride details: GET /rides/{trip_id}
- Cancel trip: POST /rides/{trip_id}/cancel with reason
- Driver earnings breakdown: GET /rides/driver-earnings (today/week/month)
- Ride history (passenger): completed/past trips endpoint
- Ride history (driver): filtered by driver_id

### Frontend
- /passenger/search: search and browse available trips
- /passenger/ride-details: trip info and bids
- /passenger/history: past rides
- /passenger/boarding: pre-ride boarding UI
- /driver/create: driver posts new trip
- /driver/requests: incoming passenger requests
- /driver/history: past completed trips

## 4. Driver Bidding

### Backend (backend/routers/bids_router.py)
- Place a bid: POST /bids/
- View all my bids: GET /bids/my-bids (with trip details + passenger notes)
- View bids on a trip: GET /bids/trip/{trip_id}
- Accept a bid: POST /bids/{bid_id}/accept (assigns driver, generates OTP)
- Reject a bid: POST /bids/{bid_id}/reject
- Counter bid: POST /bids/{bid_id}/counter
- Optimistic locking on bids via version column

### Frontend
- Bid list on ride detail page (passenger)
- Accept/reject bid buttons
- Counter-bid UI with inline amount input (mobile + desktop)

## 5. OTP Verification

### Backend (backend/routers/otp_router.py)
- OTP generated on bid accept (Trip.start_otp)
- OTP verify endpoint: POST /rides/{trip_id}/verify-otp (driver role only)
- Rate limiting on OTP verification (5 attempts/min)
- OTP already-verified guard returns 400
- Trip status transitions to ACTIVE after OTP verify
- Trip completion endpoint: POST /rides/{trip_id}/complete

### Frontend
- /verify-otp OTP input page
- Passenger OTP display on desktop and mobile (sticky bottom bar)
- Driver OTP entry wired in live driver view

## 6. Real-Time WebSocket and Live Tracking

### Backend (backend/routers/websocket_router.py, backend/websocket_manager.py)
- WebSocket endpoint: WS /ws?token=<jwt> (JWT-authenticated)
- Role-based connection routing for drivers and passengers
- New ride request broadcast to drivers (type: new_ride_request)
- New bid personal message to passenger (type: new_bid)
- Ping/pong keepalive in receive loop
- Live location update endpoint: POST /rides/{trip_id}/location
- Location stored in DB (live_locations latest + trip_locations history)
- Broadcast location to passenger via websocket manager
- Trip status change notifications (bid acceptance, trip start, completion)

### Frontend
- WebSocketContext.tsx with auto-reconnect
- /passenger/live: passenger live view with map
- /driver/live: driver live view with map
- Map components in components/map (Leaflet/Mapbox/Google Maps wired)

## 7. Billing and Payments

### Backend (backend/routers/wallet_router.py, backend/routers/payment_methods_router.py)
- Wallet per user auto-created on first access
- Wallet balance and transactions: GET /wallet, GET /wallet/transactions
- Add money (Razorpay): POST /wallet/add-money creates order
- Verify Razorpay payment: POST /wallet/verify-payment with HMAC signature check
- Payment methods: list, add, set default, delete
- Auto-bill on ride completion with Transaction records per passenger
- Receipt endpoint: GET /rides/{trip_id}/receipt (full receipt JSON)
- Driver rating: POST /rides/{trip_id}/rate-driver; rolling average on Driver model

### Frontend
- /passenger/wallet: balance, transactions, add money
- Wallet UI components in components/wallet
- Receipt card + driver rating UI in passenger trip view

## 8. Dashboards and Profiles
- /passenger/dashboard and /driver/dashboard
- /driver/earnings page (today/week/month)
- /profile view/edit page
- Profile UI components in components/profile
- /passenger/ride-sharing page

## 9. Non-Functional Requirements
- Password encryption (bcrypt)
- Stateless JWT authentication for protected routes
- Rate limiting for sensitive endpoints
- Optimistic locking for concurrency safety
- WebSocket realtime communication layer
- Data consistency via PostgreSQL + SQLAlchemy with locks
- CORS configured in main.py

## 10. Testing and QA
- Backend tests: tests/test_auth.py, tests/test_rides.py, tests/test_bids.py,
  tests/test_otp.py, tests/test_websocket.py
- Frontend E2E tests: tests/e2e/auth.spec.ts, rides.spec.ts, bids.spec.ts,
  otp.spec.ts, wallet.spec.ts
- Playwright configured in playwright.config.ts, run with npm run test:e2e
- Legacy/manual scripts present under backend/tests/legacy and root

## 11. Deployment
- backend/Dockerfile and frontend/Dockerfile
- docker-compose.yml for local orchestration
- Standalone Next.js config in frontend

## 12. Partially Done / Needs Verification
- None listed

## 13. Not Implemented
- Admin panel (optional per spec)

## 14. Assessment and Recommendations (Campus Auto-Rickshaw)

This is a comprehensive ride-sharing implementation for your college community. The current state is strong, but there are gaps that matter for student safety and trust.

### What's Strong in Your Implementation

Core infrastructure (100% complete):
- Solid auth system with JWT, bcrypt, role-based access, and multiple verification methods (email, phone, Google OAuth)
- Complete bidding system with counter-bids and optimistic locking
- Real-time WebSocket layer for live tracking and notifications
- Wallet + Razorpay integration with auto-billing on ride completion
- OTP verification flow for ride start with rate limiting

Student-specific features:
- Ride sharing capability via TripPassenger association table
- Driver earnings dashboard (today/week/month breakdown)
- Saved places for frequent campus-to-city routes
- Both mobile and desktop OTP display for passengers

### Critical Gaps for a Campus Auto-Rickshaw Service

1. Safety infrastructure (priority: critical)
- SOS or emergency button with one-tap contact to campus security and emergency contacts
- Route deviation alerts (notify passengers if drivers take unexpected detours)
- Share trip status (real-time link sharing with live location, driver details, ETA)
- Emergency contacts required during onboarding, not optional

2. Identity verification and trust
- Student ID verification (CHARUSAT email domain validation or student ID upload)
- Driver selfie verification before each trip
- Vehicle document verification (registration, insurance, driver license)
- Gender preference option for riders

3. Communication privacy
- Masked phone numbers (route calls through Twilio or Vonage)
- In-app chat instead of external messaging

4. Operational features for auto-rickshaws
- License plate visualization (show auto number plate in Gujarat RTO format)
- Exact seat availability (for 3-4 passenger capacity)
- Fare splitting among co-passengers
- Scheduled rides (advance booking for return trips)

5. Trust and community features
- Driver or rider ratings with detailed feedback (on time, safe driving, clean vehicle)
- Repeat preference (favorite reliable drivers)
- College community indicators (CHARUSAT student badges)

### Technical Recommendations

Immediate additions (high impact, low effort):
1. SOS button: add emergency contact table and SOS endpoint that sends SMS to campus security + emergency contacts with live location
2. Trip sharing: generate shareable links (for example, /track/abc123) showing live trip status without login
3. CHARUSAT email verification: restrict registration to @charusat.edu.in emails for students
4. License plate display: format vehicle numbers to look like Gujarat plates in the UI

Medium-term (1-2 weeks):
1. Route deviation detection: compare GPS coordinates against expected route; alert if deviation > 500m
2. Masked calling: integrate Twilio for proxy phone numbers during active trips
3. Scheduled rides: add scheduled_at field to Trip model for advance bookings

Long-term or optional admin panel features:
- Manual verification dashboard for student IDs and vehicle documents
- Dispute resolution interface for billing issues
- Driver performance analytics (cancellation rates, ratings)
- Campus security dashboard for monitoring active trips

### Architecture Suggestions

Database models to add:
```sql
-- Emergency contacts
emergency_contacts (user_id, name, phone, relationship, is_primary)

-- Safety events
safety_events (trip_id, type [sos|deviation|alert], location, resolved_at)

-- Student verifications
student_verifications (user_id, college_email, student_id_image, status, verified_at)

-- Scheduled trips
trip_schedules (trip_id, scheduled_at, recurrence_pattern)
```

WebSocket events to add:
- sos_triggered: broadcast to campus security and emergency contacts
- route_deviation_alert: notify passenger
- trip_shared: update shared link viewers

### Final Assessment

This implementation is technically sophisticated for a college project. Counter-bids, optimistic locking, and wallet auto-deduction are advanced features. For a student safety-critical auto-rickshaw service, the missing safety infrastructure (SOS, route monitoring, identity verification) is a significant gap.

Recommendation: prioritize SOS, student email verification, and trip sharing before real-world deployment. The existing WebSocket layer and auth system can be extended to cover these additions quickly.
