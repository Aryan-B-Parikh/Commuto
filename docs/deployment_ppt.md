# Commuto Deployed Version - PPT Outline (10 Slides)

## Slide 1 - Title
Purpose: Introduce the product and the deployed system.
Content:
- Commuto: Ride-Sharing Platform (Deployed)
- Tagline: Bidding-based campus ride sharing with live tracking
- Presenter, team, date
Visuals:
- App logo or hero screen (login or dashboard)
Notes:
- Mention this deck covers what was built, how it works, and how it is deployed.

## Slide 2 - Problem and Goal
Purpose: State the problem and the solution goal.
Content:
- Campus commute pain points: availability, pricing, safety, trust
- Goal: reliable shared rides with transparent bidding and live tracking
- Two roles: passenger and driver
Visuals:
- Simple problem/solution split graphic
Notes:
- Keep the problem concise and align with a campus context.

## Slide 3 - User Roles and Primary Flows
Purpose: Show the main user journey end-to-end.
Content:
- Passenger: signup -> verify -> create shared ride -> receive bids -> accept -> OTP start -> track -> complete -> receipt + rating
- Driver: signup -> verify -> browse open rides -> bid -> OTP start -> live updates -> complete
Visuals:
- Swimlane flow for passenger vs driver
Notes:
- Emphasize OTP safety gates and rating at the end.

## Slide 4 - Architecture Overview
Purpose: Explain the system layout.
Content:
- Frontend: Next.js (App Router) on Vercel
- Backend: FastAPI on Render
- Database: PostgreSQL (managed)
- Realtime: WebSocket layer
Visuals:
- High-level block diagram with arrows
Notes:
- Call out API and WebSocket communication paths.

## Slide 5 - Backend Capabilities (APIs)
Purpose: Summarize what the backend delivers.
Content:
- Auth: email verification, phone OTP, Google OAuth
- Rides: create shared rides, join/leave, trip lifecycle
- Bidding: place, accept, counter bids
- Wallet: Razorpay top-up, transfer, auto-collect on completion
- Notifications and geofence endpoints
Visuals:
- API domain icons or a simple table
Notes:
- Keep API list short, focus on feature groups.

## Slide 6 - Real-Time and Tracking
Purpose: Show how live updates work.
Content:
- WebSocket: /ws for global events, /ws/trips/{trip_id} for trip rooms
- Live location updates stored and broadcast
- Trip status notifications for all parties
Visuals:
- Sequence diagram (driver location -> backend -> passenger map)
Notes:
- Mention auto-reconnect on the frontend.

## Slide 7 - Payments and Billing
Purpose: Explain billing flow end-to-end.
Content:
- Wallet top-up via Razorpay
- Ride completion triggers payment collection
- Receipt endpoint and driver rating flow
Visuals:
- Payment flow diagram + receipt screenshot
Notes:
- Highlight audit trail via wallet transactions.

## Slide 8 - Deployment Pipeline
Purpose: Explain how the deployed system is set up.
Content:
- Render: backend Docker build + managed Postgres
- Vercel: frontend deployment
- Env templates: render.env, vercel.env
- CORS and WebSocket (wss) configuration
Visuals:
- Deployment diagram or CI/CD flow
Notes:
- Include placeholders for production URLs if needed.

## Slide 9 - Testing and Verification
Purpose: Show quality gates.
Content:
- Backend: pytest suites for auth, rides, bids, OTP, websocket
- Frontend: Playwright E2E
- Manual flow verification scripts in scripts/verification
Visuals:
- Test matrix or checklist
Notes:
- Reinforce coverage across critical flows.

## Slide 10 - Status and Next Steps
Purpose: Wrap up with current status and roadmap.
Content:
- Current: core features deployed and stable
- Gaps: admin panel, safety enhancements (SOS, route deviation), expanded trust features
- Next: production monitoring + advanced safety
Visuals:
- Roadmap timeline
Notes:
- Keep next steps realistic and time-boxed.
