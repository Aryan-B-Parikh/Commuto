# Software Requirements Specification

## for

# Commuto – Ride-Sharing Platform

**Version 1.0 approved**

**Prepared by** Aryan B Parikh

**CSPIT – CSE**

**31-03-2026**

---

## Table of Contents

1. [Introduction](#1-introduction)
   - 1.1 [Introduction](#11-introduction)
   - 1.2 [Document Conventions](#12-document-conventions)
   - 1.3 [Intended Audience and Reading Suggestions](#13-intended-audience-and-reading-suggestions)
   - 1.4 [Project Scope](#14-project-scope)
   - 1.5 [References](#15-references)
2. [Overall Description](#2-overall-description)
   - 2.1 [Product Perspective](#21-product-perspective)
   - 2.2 [Product Features](#22-product-features)
   - 2.3 [User Classes and Characteristics](#23-user-classes-and-characteristics)
   - 2.4 [Operating Environment](#24-operating-environment)
   - 2.5 [Design and Implementation Constraints](#25-design-and-implementation-constraints)
   - 2.6 [User Documentation](#26-user-documentation)
   - 2.7 [Assumptions and Dependencies](#27-assumptions-and-dependencies)
3. [System Features](#3-system-features)
   - 3.1 [User Authentication & Registration](#31-user-authentication--registration)
   - 3.2 [Ride Request Management](#32-ride-request-management)
   - 3.3 [Driver Bidding System](#33-driver-bidding-system)
   - 3.4 [OTP Verification & Trip Lifecycle](#34-otp-verification--trip-lifecycle)
   - 3.5 [Real-Time WebSocket & Live Tracking](#35-real-time-websocket--live-tracking)
   - 3.6 [Billing & Payments (Wallet + Razorpay)](#36-billing--payments-wallet--razorpay)
   - 3.7 [Dashboards & Profiles](#37-dashboards--profiles)
4. [External Interface Requirements](#4-external-interface-requirements)
   - 4.1 [User Interfaces](#41-user-interfaces)
   - 4.2 [Hardware Interfaces](#42-hardware-interfaces)
   - 4.3 [Software Interfaces](#43-software-interfaces)
   - 4.4 [Communications Interfaces](#44-communications-interfaces)
5. [Other Nonfunctional Requirements](#5-other-nonfunctional-requirements)
   - 5.1 [Performance Requirements](#51-performance-requirements)
   - 5.2 [Safety Requirements](#52-safety-requirements)
   - 5.3 [Security Requirements](#53-security-requirements)
   - 5.4 [Software Quality Attributes](#54-software-quality-attributes)
6. [Other Requirements](#6-other-requirements)
7. [Appendices](#7-appendices)
   - Appendix A: Glossary
   - Appendix B: Analysis Models
   - Appendix C: Issues List

---

## Revision History

| Name | Date | Reason For Changes | Version |
|------|------|--------------------|---------|
| Aryan B Parikh | 31-03-2026 | Initial SRS document | 1.0 |
|  |  |  |  |

---

## 1) Introduction

### 1.1 Introduction

Commuto is a modern ride-sharing and carpooling platform built as a web application. It connects passengers who need rides with drivers who can offer them, using a unique **bidding-based matching system**. Unlike traditional ride-hailing apps where prices are fixed, Commuto allows drivers to place competitive bids on ride requests, and passengers can accept, reject, or counter-offer bids to find the best match in terms of price and convenience.

The platform facilitates the entire ride lifecycle — from posting a ride request, bidding, accepting bids, OTP-based trip verification, real-time location tracking, to post-ride billing and driver ratings. Commuto is designed as a monorepo containing a **FastAPI** backend REST API with WebSocket support and a **Next.js 16** frontend application.

### 1.2 Document Conventions

This document follows the IEEE 830 standard for Software Requirements Specifications. The following conventions are used:

- **Bold text** indicates key terms, feature names, or important emphasis.
- `Monospace text` indicates code elements, API endpoints, file names, or technical identifiers.
- Section numbering follows hierarchical format (e.g., 3.1.1, 3.1.2, 3.1.3).
- Priority levels: **High** (core functionality), **Medium** (important but not critical), **Low** (nice-to-have).

### 1.3 Intended Audience and Reading Suggestions

This document is intended for the following audiences:

- **Developers**: Full-stack developers working on the Commuto codebase. They should read all sections, with particular focus on Sections 3 (System Features) and 4 (External Interfaces).
- **Project Evaluators / Faculty**: Academic evaluators assessing project completeness. They should read Sections 1, 2, and 3 for a comprehensive overview.
- **Testers / QA**: Personnel responsible for verifying the application. They should focus on Sections 3 (functional requirements) and 5 (non-functional requirements).
- **End Users (Passengers & Drivers)**: Users of the platform. They should read Sections 2.2 (Product Features) and 2.3 (User Classes) for a high-level understanding.

It is recommended to read the document sequentially, starting from the Introduction and proceeding through each section.

### 1.4 Project Scope

Commuto aims to provide a transparent, competitive, and real-time ride-sharing platform. The scope of this project includes:

- **User registration and authentication** with support for email/password, phone OTP, and Google OAuth sign-in.
- **Role-based access control** for two user types: Passenger and Driver.
- **Ride request creation** where passengers specify pickup, destination, departure time, and number of seats.
- **Competitive bidding** where drivers bid on ride requests with price-per-seat offers.
- **Counter-bidding** allowing passengers and drivers to negotiate prices.
- **OTP-based trip verification** for secure ride initiation.
- **Real-time tracking** of driver location during active trips via WebSocket.
- **Digital wallet system** with Razorpay payment gateway integration for adding funds and automatic fare deduction.
- **Post-ride billing** with receipt generation and driver rating.
- **Comprehensive dashboards** for both passengers and drivers, including earnings and ride history.
- **Docker-based deployment** for production readiness.

**Out of scope**: Admin panel for platform management (optional, not implemented in v1.0).

### 1.5 References

- FastAPI Documentation: https://fastapi.tiangolo.com/
- Next.js Documentation: https://nextjs.org/docs
- SQLAlchemy ORM: https://docs.sqlalchemy.org/
- Razorpay API: https://razorpay.com/docs/api/
- Leaflet.js Maps: https://leafletjs.com/
- IEEE 830 SRS Standard: https://standards.ieee.org/

---

## 2 Overall Description

### 2.1 Product Perspective

Commuto is a self-contained, full-stack web application built as a monorepo with two primary components:

**Backend (FastAPI REST API + WebSocket Server)**:
- Built with **FastAPI 0.115.0** (Python), providing RESTful API endpoints and WebSocket connections.
- Uses **PostgreSQL** (hosted via Neon) as the primary database with **SQLAlchemy 2.0** ORM.
- Implements **JWT-based authentication** using python-jose with bcrypt password hashing.
- Supports **real-time communication** via WebSocket for bid notifications, trip status updates, and live driver location.
- Integrates **Razorpay** payment gateway for wallet top-ups.
- Includes **rate limiting** via SlowAPI with optional Redis support for distributed deployments.

**Frontend (Next.js 16 App Router)**:
- Built with **Next.js 16**, **React 19**, and **TypeScript**.
- Styled with **Tailwind CSS 4**.
- Uses **Axios** for HTTP API communication.
- Integrates **Leaflet + React-Leaflet** for map rendering and route visualization.
- Uses **Framer Motion** for smooth UI animations.
- Implements **Google OAuth** via `@react-oauth/google`.

The system follows a **client-server architecture** where the Next.js frontend communicates with the FastAPI backend via REST APIs (for CRUD operations) and WebSockets (for real-time updates).

### 2.2 Product Features

The major features of Commuto are:

1. **User Authentication & Registration** — Email/password, phone OTP, and Google OAuth sign-in with role-based access (passenger/driver).
2. **Ride Request Creation** — Passengers post ride requests specifying origin, destination, departure time, seats needed, and optional notes.
3. **Driver Bidding Marketplace** — Drivers browse open ride requests and submit competitive price-per-seat bids.
4. **Counter-Bidding & Negotiation** — Passengers can counter-offer driver bids; drivers can respond with adjusted prices.
5. **OTP-Based Trip Verification** — A 6-digit OTP is generated on bid acceptance; the driver must verify OTP at pickup to start the trip.
6. **Real-Time Location Tracking** — Driver location is tracked and broadcast to passengers via WebSocket during active trips.
7. **Digital Wallet & Payments** — Users have a wallet with Razorpay integration for adding funds; fare is auto-deducted on trip completion.
8. **Receipt & Rating System** — Post-ride receipt with fare breakdown; 5-star driver rating with rolling averages.
9. **Comprehensive Dashboards** — Separate dashboards for passengers and drivers with ride history, earnings, and active trips.
10. **Shared Rides / Carpooling** — Support for multi-passenger shared commutes.

### 2.3 User Classes and Characteristics

The system supports two primary user roles:

**1. Passenger**
- Registers an account and selects the "Passenger" role.
- Can create ride requests with pickup/drop-off locations, time, and seat count.
- Can view incoming bids from drivers, accept, reject, or counter-offer bids.
- Has a digital wallet for payments.
- Can view ride history, active trips, and receipts.
- Can rate drivers after completed trips.
- Has a profile with personal details, saved places, and accessibility needs preferences.

**2. Driver**
- Registers an account and selects the "Driver" role.
- Must provide vehicle details (make, model, plate number, capacity) and license information.
- Can browse open ride requests and place competitive bids.
- Receives real-time notifications of new ride requests via WebSocket.
- Must verify passenger OTP at pickup to start a trip.
- Can update live location during active trips.
- Has an earnings dashboard (daily, weekly, monthly breakdowns).
- Has a driver profile with rating, total trips completed, and online status.

Both user types require basic technical proficiency to use a web browser and navigate the platform.

### 2.4 Operating Environment

The operating environment for Commuto is as follows:

- **Client-side**: Any modern web browser (Chrome, Firefox, Safari, Edge) on Windows, macOS, Linux, Android, or iOS.
- **Server-side**:
  - Operating System: Linux (Docker containers) or Windows for development.
  - Python 3.12+ runtime for the FastAPI backend.
  - Node.js 20+ runtime for the Next.js frontend.
  - PostgreSQL database (Neon cloud-hosted or self-hosted).
  - Redis (optional, for distributed rate limiting in production).
- **Deployment**: Docker + docker-compose for containerized deployment.

### 2.5 Design and Implementation Constraints

The following constraints apply to the Commuto system:

- **Database**: PostgreSQL is the only supported database due to the use of PostgreSQL-specific features (UUID columns, JSONB fields, row-level locking with `SELECT FOR UPDATE`).
- **Authentication**: JWT tokens have a configurable expiration (default 30 minutes). WebSocket connections pass the token as a query parameter due to browser WebSocket API limitations with custom headers.
- **Rate Limiting**: All sensitive endpoints are rate-limited to prevent abuse. In single-instance deployments, rate limits are tracked in memory; Redis is required for multi-instance deployments.
- **Optimistic Locking**: The Trip and TripBid models use `version` columns for optimistic locking, which means concurrent modification conflicts must be handled gracefully.
- **Payment Gateway**: Razorpay is the sole payment gateway integration. All monetary transactions use Razorpay's order and payment verification APIs.
- **Map Provider**: The frontend uses Leaflet (open-source) for map rendering. OLA Maps API key is configured for geocoding services.
- **CORS Policy**: Backend CORS is restricted to configured origins only; no wildcard (`*`) is allowed in production.

### 2.6 User Documentation

The following user documentation is available:

- **README.md**: Project setup and installation guide, including backend and frontend setup instructions, environment variable configuration, and API endpoint reference.
- **CREDENTIALS.md**: Development credential reference for local testing.
- **In-app Navigation**: The application provides intuitive navigation with clear labels, dashboards, and user-friendly forms for ride creation, bidding, and wallet management.
- **Swagger / ReDoc API Docs**: Auto-generated interactive API documentation accessible at `/docs` (Swagger UI) and `/redoc` (ReDoc) on the backend server.

### 2.7 Assumptions and Dependencies

**Assumptions:**
- Users have access to a modern web browser with JavaScript enabled.
- Users have a stable internet connection for real-time features (WebSocket, live tracking).
- Drivers have GPS-enabled devices for location tracking.
- A PostgreSQL database instance (Neon or self-hosted) is available and accessible.
- Razorpay API credentials are valid and active for payment processing.

**Dependencies:**
- **Neon (PostgreSQL)**: Cloud-hosted database service.
- **Razorpay**: Payment gateway for wallet top-ups and payment verification.
- **Google OAuth**: Google Identity Services for social sign-in.
- **Twilio** (optional): SMS provider for phone OTP verification in production.
- **SMTP Server** (optional): Email service for email verification in production.
- **Redis** (optional): For distributed rate limiting in multi-instance deployments.

---

## 3 System Features

### 3.1 User Authentication & Registration

#### 3.1.1 Description and Priority

**Priority: High**

This feature provides user registration, login, and authentication for the Commuto platform. It supports three authentication methods (email/password, phone OTP, Google OAuth) and enforces role-based access control (passenger or driver). All protected API endpoints require a valid JWT token.

#### 3.1.2 Stimulus/Response Sequences

1. **User Registration**: A new user opens the signup page → fills in email, password, full name, and selects a role (passenger/driver) → submits the form → system creates the user account with the appropriate profile (Passenger or Driver) → system returns a JWT token → user is redirected to verification flow.
2. **Email Verification**: System sends a verification email with a token → user clicks the link or enters the token → system marks the email as verified.
3. **Phone Verification**: System sends a 6-digit OTP to the user's phone → user enters the OTP → system verifies and marks the phone as verified.
4. **User Login**: User enters email and password → system validates credentials → system returns a JWT token → user is redirected to their role-specific dashboard.
5. **Google OAuth**: User clicks "Sign in with Google" → Google authentication popup appears → user selects account → system verifies the Google ID token → if new user, system creates account and prompts for role selection → system returns a JWT token.
6. **Profile Update**: Authenticated user navigates to profile page → edits personal details (name, phone, gender, bio, emergency contact) → submits → system updates the user profile.

#### 3.1.3 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-01 | The system shall allow users to register with email, password, full name, and role (passenger/driver). | High |
| AUTH-02 | The system shall hash passwords using bcrypt before storing them in the database. | High |
| AUTH-03 | The system shall issue JWT tokens upon successful login with a configurable expiration time (default: 30 minutes). | High |
| AUTH-04 | The system shall enforce email uniqueness and return an error if a duplicate email is used for registration. | High |
| AUTH-05 | The system shall support email verification via a verification token sent to the user's email address. | Medium |
| AUTH-06 | The system shall support phone OTP verification via a 6-digit OTP. | Medium |
| AUTH-07 | The system shall support Google OAuth sign-in, creating a new user account on first login. | Medium |
| AUTH-08 | The system shall create corresponding profiles (Driver or Passenger) automatically upon registration based on the selected role. | High |
| AUTH-09 | The system shall rate-limit registration to 5 requests per minute and login to 10 requests per minute. | High |
| AUTH-10 | The system shall provide a profile update endpoint (`PATCH /auth/profile`) for authenticated users. | Medium |
| AUTH-11 | Driver registration shall optionally include vehicle details (make, model, plate number, capacity). | Medium |

---

### 3.2 Ride Request Management

#### 3.2.1 Description and Priority

**Priority: High**

This feature allows passengers to create ride requests specifying their pickup location, destination, departure time, number of seats, and price per seat. Drivers can browse available ride requests and view details. Passengers can also cancel pending requests.

#### 3.2.2 Stimulus/Response Sequences

1. **Create Ride Request**: Passenger opens the ride creation form → enters origin address, destination address (with latitude/longitude), departure time, number of seats (1-4), and price per seat → submits → system creates the trip with status "pending" → system broadcasts a WebSocket notification to all online drivers.
2. **Browse Open Rides (Driver)**: Driver opens the ride requests page → system displays a list of open/pending ride requests → driver can filter by location and time → driver selects a ride to view details and place a bid.
3. **Cancel Ride**: Passenger opens their active ride → clicks "Cancel" → provides a reason → system cancels the trip and calculates a cancellation penalty if applicable.
4. **View Ride History**: User navigates to ride history → system displays a list of past completed/cancelled trips with details.

#### 3.2.3 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| RIDE-01 | The system shall allow passengers to create ride requests with origin (address + coordinates), destination (address + coordinates), departure time, seats (1-4), and price per seat. | High |
| RIDE-02 | The departure time must be in the future; the system shall reject past timestamps. | High |
| RIDE-03 | The system shall broadcast a WebSocket notification (`type: new_ride_request`) to all connected drivers when a new ride request is created. | High |
| RIDE-04 | The system shall allow drivers to browse all available (pending) ride requests via `GET /rides/available`. | High |
| RIDE-05 | The system shall allow passengers to cancel pending ride requests with a cancellation reason. | Medium |
| RIDE-06 | The system shall calculate cancellation penalties for late cancellations. | Medium |
| RIDE-07 | The system shall rate-limit ride creation to 5 requests per minute and cancellation to 10 per minute. | High |
| RIDE-08 | The system shall support optional notes (max 500 characters) on ride requests. | Low |
| RIDE-09 | The system shall provide ride history endpoints for both passengers and drivers. | Medium |
| RIDE-10 | The system shall provide a driver earnings breakdown (`GET /rides/driver-earnings`) with today/week/month periods. | Medium |

---

### 3.3 Driver Bidding System

#### 3.3.1 Description and Priority

**Priority: High**

This is the core differentiating feature of Commuto. Drivers place competitive price-per-seat bids on ride requests. Passengers can accept, reject, or counter-offer bids. The system uses optimistic locking and database transactions to prevent race conditions during concurrent bid operations.

#### 3.3.2 Stimulus/Response Sequences

1. **Place Bid**: Driver views an open ride request → enters a bid amount (price per seat) and optional message → submits → system creates the bid → system sends a WebSocket notification (`type: new_bid`) to the passenger.
2. **Accept Bid**: Passenger views incoming bids → selects a bid → clicks "Accept" → system marks the bid as accepted, assigns the driver to the trip, generates a 6-digit OTP → system notifies the driver of acceptance.
3. **Reject Bid**: Passenger views a bid → clicks "Reject" → system marks the bid as rejected → driver is notified.
4. **Counter Bid**: Passenger views a bid → clicks "Counter" → enters a new price → submits → system creates a counter-bid linked to the parent bid → driver is notified of the counter-offer.

#### 3.3.3 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| BID-01 | The system shall allow drivers to place bids on pending ride requests with a bid amount and optional message (max 500 characters). | High |
| BID-02 | The system shall prevent a driver from bidding on their own ride request. | High |
| BID-03 | The system shall notify the passenger in real-time (via WebSocket) when a new bid is placed on their ride request. | High |
| BID-04 | The system shall allow passengers to accept a bid, which assigns the driver to the trip and generates a 6-digit OTP. | High |
| BID-05 | The system shall allow passengers to reject a bid, updating its status to "rejected". | Medium |
| BID-06 | The system shall support counter-bidding, where a passenger proposes a different price linked to the original bid. | High |
| BID-07 | The system shall use optimistic locking (`version` column) on TripBid records to prevent concurrent modification conflicts. | High |
| BID-08 | The system shall rate-limit bid placement to 5 bids per minute per driver. | High |
| BID-09 | The system shall allow drivers to view all their submitted bids via `GET /bids/my-bids`. | Medium |
| BID-10 | The system shall allow passengers to view all bids on a specific trip via `GET /bids/trip/{trip_id}`. | Medium |

---

### 3.4 OTP Verification & Trip Lifecycle

#### 3.4.1 Description and Priority

**Priority: High**

Upon bid acceptance, a 6-digit OTP is generated and displayed to the passenger. The driver must enter this OTP at pickup to verify identity and start the trip. Once verified, the trip becomes "active." The driver can then mark the trip as "completed" upon reaching the destination.

#### 3.4.2 Stimulus/Response Sequences

1. **OTP Display**: After a bid is accepted → system generates a 6-digit OTP → OTP is displayed to the passenger on their ride details page (both desktop and mobile sticky bottom bar).
2. **OTP Verification (Trip Start)**: Driver arrives at pickup → enters the 6-digit OTP shared by the passenger → system verifies the OTP → trip status changes to "active" → both driver and passenger are notified.
3. **Trip Completion**: Driver reaches the destination → clicks "Complete Trip" → system marks the trip as completed → auto-deducts fare from passenger's wallet → creates a transaction ledger entry → generates a receipt.

#### 3.4.3 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| OTP-01 | The system shall generate a 6-digit OTP and store it in the Trip record upon bid acceptance. | High |
| OTP-02 | The system shall display the OTP to the passenger on their ride details screen (desktop and mobile views). | High |
| OTP-03 | The system shall provide an OTP verification endpoint (`POST /rides/{trip_id}/verify-otp`) accessible only to the assigned driver. | High |
| OTP-04 | The system shall transition the trip status from "bid_accepted" to "active" upon successful OTP verification. | High |
| OTP-05 | The system shall return an error if the OTP has already been verified (preventing double-verification). | Medium |
| OTP-06 | The system shall rate-limit OTP verification to 5 attempts per minute. | High |
| OTP-07 | The system shall provide a trip completion endpoint (`POST /rides/{trip_id}/complete`) to mark trips as done. | High |
| OTP-08 | Upon trip completion, the system shall auto-deduct the fare from each passenger's wallet and create a Transaction record. | High |
| OTP-09 | The system shall broadcast trip status changes (start, completion) to all relevant parties via WebSocket. | High |

---

### 3.5 Real-Time WebSocket & Live Tracking

#### 3.5.1 Description and Priority

**Priority: High**

Commuto uses WebSocket connections for real-time communication between the server and clients. This includes notifications for new ride requests, bid updates, trip status changes, and live driver location tracking during active trips.

#### 3.5.2 Stimulus/Response Sequences

1. **WebSocket Connection**: User logs in → frontend establishes a WebSocket connection using the JWT token as a query parameter (`/ws?token=<jwt>`) → server authenticates and registers the connection.
2. **New Ride Notification**: Passenger creates a ride request → server broadcasts `new_ride_request` event to all connected drivers.
3. **Bid Notification**: Driver places a bid → server sends `new_bid` event to the specific passenger.
4. **Live Location Update**: During an active trip → driver's app periodically sends location updates via `POST /rides/{trip_id}/location` → server stores the location in both `LiveLocation` (latest) and `TripLocation` (history) tables → server broadcasts the location to the passenger via WebSocket.
5. **Auto-Reconnect**: If the WebSocket connection drops → frontend automatically attempts to reconnect with exponential backoff.

#### 3.5.3 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| WS-01 | The system shall provide a WebSocket endpoint (`WS /ws?token={jwt}`) with JWT-based authentication. | High |
| WS-02 | The system shall track driver and passenger WebSocket connections separately for role-based routing. | High |
| WS-03 | The system shall broadcast `new_ride_request` events to all connected drivers when a new ride request is created. | High |
| WS-04 | The system shall send `new_bid` personal messages to the passenger when a driver bids on their ride. | High |
| WS-05 | The system shall implement ping/pong keepalive to detect stale connections. | Medium |
| WS-06 | The system shall provide a location update endpoint (`POST /rides/{trip_id}/location`) rate-limited to 60 updates per minute. | High |
| WS-07 | The system shall store driver locations in both `LiveLocation` (latest only) and `TripLocation` (full history) tables. | High |
| WS-08 | The system shall broadcast driver location updates to passengers via WebSocket during active trips. | High |
| WS-09 | The frontend shall implement auto-reconnecting WebSocket with exponential backoff. | Medium |
| WS-10 | The system shall broadcast trip status change notifications (bid acceptance, trip start, trip completion) via WebSocket. | High |

---

### 3.6 Billing & Payments (Wallet + Razorpay)

#### 3.6.1 Description and Priority

**Priority: High**

Commuto implements a digital wallet system for managing payments. Users can add money to their wallet via Razorpay, and fares are automatically deducted from the passenger's wallet upon trip completion. The system also supports payment method management and post-ride receipts with driver ratings.

#### 3.6.2 Stimulus/Response Sequences

1. **Add Money**: User navigates to wallet → enters an amount to add → system creates a Razorpay order → user completes payment on Razorpay → system verifies the payment signature → wallet balance is credited.
2. **Auto-Deduct on Completion**: Trip is completed → system calculates the fare (price per seat × seats booked) → deducts the amount from each passenger's wallet → creates Transaction records → updates payment status.
3. **View Receipt**: Passenger opens a completed trip → system displays the receipt with fare breakdown, trip details, and driver information → passenger can rate the driver with 1-5 stars.
4. **Manage Payment Methods**: User navigates to settings → can add, delete, or set a default payment method (card, UPI, netbanking).

#### 3.6.3 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| PAY-01 | The system shall auto-create a wallet for each user on first access. | High |
| PAY-02 | The system shall provide endpoints to check wallet balance (`GET /wallet`) and view transaction history (`GET /wallet/transactions`). | High |
| PAY-03 | The system shall integrate with Razorpay to create orders (`POST /wallet/add-money`) and verify payments (`POST /wallet/verify-payment`) using HMAC signature validation. | High |
| PAY-04 | The system shall auto-deduct the fare from each passenger's wallet upon trip completion and create a Transaction record. | High |
| PAY-05 | The system shall provide a receipt endpoint (`GET /rides/{trip_id}/receipt`) returning full trip and billing details. | Medium |
| PAY-06 | The system shall support adding, listing, deleting, and setting default payment methods (card, UPI, netbanking). | Medium |
| PAY-07 | The system shall support driver rating via `POST /rides/{trip_id}/rate-driver` with a 1-5 star scale, maintaining a rolling average on the Driver profile. | Medium |
| PAY-08 | Transaction records shall track type (credit, payment, refund), amount, status, and Razorpay order/payment IDs. | High |

---

### 3.7 Dashboards & Profiles

#### 3.7.1 Description and Priority

**Priority: Medium**

Both passengers and drivers have dedicated dashboards for managing their activities. Profiles include personal details, preferences, and role-specific information.

#### 3.7.2 Stimulus/Response Sequences

1. **Passenger Dashboard**: Passenger logs in → dashboard shows active rides, recent activity, quick ride creation.
2. **Driver Dashboard**: Driver logs in → dashboard shows available ride requests, active trips, earnings summary.
3. **Driver Earnings**: Driver navigates to earnings page → system displays today/week/month breakdowns of trip earnings.
4. **Profile Management**: User navigates to profile → can view/edit personal details, manage saved places, and configure preferences.

#### 3.7.3 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| DASH-01 | The system shall provide a passenger dashboard at `/passenger/dashboard` showing active rides and quick actions. | Medium |
| DASH-02 | The system shall provide a driver dashboard at `/driver/dashboard` showing available requests and active trips. | Medium |
| DASH-03 | The system shall provide a driver earnings page at `/driver/earnings` with daily, weekly, and monthly breakdowns. | Medium |
| DASH-04 | The system shall provide a profile page at `/profile` for viewing and editing user details, including emergency contact and saved places. | Medium |
| DASH-05 | The system shall support saving frequently used places with name, address, and coordinates. | Low |

---

## 4 External Interface Requirements

### 4.1 User Interfaces

- **Frontend Framework**: Next.js 16 (App Router) with React 19 and TypeScript.
- **Styling**: Tailwind CSS 4 for responsive and modern UI design.
- **Animations**: Framer Motion for smooth page transitions and micro-interactions.
- **Maps**: Leaflet + React-Leaflet for interactive map rendering with pickup/drop markers and route visualization.
- **IDE/Editor**: Visual Studio Code for development.
- **Key Pages**:
  - `/login` — User login form
  - `/signup` — Registration form with role selection
  - `/select-role` — Role picker (passenger/driver)
  - `/dashboard` — Role-based redirect to passenger/driver dashboard
  - `/passenger/*` — Passenger pages (search, ride details, history, wallet, live tracking, boarding, ride-sharing)
  - `/driver/*` — Driver pages (create trip, requests, history, earnings, live tracking)
  - `/profile` — User profile management
  - `/verify-email`, `/verify-phone`, `/verify-otp` — Verification flows

### 4.2 Hardware Interfaces

- **Client**: Any device with a modern web browser — Desktop (Windows, macOS, Linux), Laptop, Tablet, or Smartphone (Android, iOS).
- **Server**: Any server hardware or cloud instance capable of running Docker containers, Python 3.12+, and Node.js 20+.
- **GPS**: Driver devices must have GPS capabilities for real-time location tracking.
- **Network**: Stable internet connection required; minimum bandwidth sufficient for WebSocket real-time communication.

### 4.3 Software Interfaces

| Software Used | Description |
|---------------|-------------|
| **Operating System** | Linux (Docker containers) for deployment; Windows/macOS for development. |
| **Database** | PostgreSQL (via Neon cloud hosting) for persistent data storage — users, trips, bids, bookings, wallets, transactions, and locations. |
| **Backend Framework** | FastAPI 0.115.0 (Python) for REST API and WebSocket server with automatic OpenAPI documentation. |
| **Frontend Framework** | Next.js 16 with React 19 (TypeScript) for the single-page application. |
| **ORM** | SQLAlchemy 2.0 for database modeling and queries with support for PostgreSQL-specific features. |
| **Payment Gateway** | Razorpay API for creating payment orders, processing payments, and verifying HMAC signatures. |
| **Authentication** | python-jose library for JWT token creation/validation; bcrypt for password hashing; Google OAuth for social sign-in. |
| **Maps / Geocoding** | Leaflet.js for map rendering; OLA Maps API for geocoding services. |
| **Rate Limiting** | SlowAPI with in-memory storage or Redis backend for distributed rate limiting. |
| **Containerization** | Docker + docker-compose for building and deploying backend and frontend services. |

### 4.4 Communications Interfaces

- **HTTP/HTTPS**: All REST API communication between the frontend and backend uses HTTP (development) or HTTPS (production) protocols.
- **WebSocket (WS/WSS)**: Real-time bidirectional communication for bid notifications, trip status updates, and live location tracking. WebSocket connections use JWT tokens passed as query parameters for authentication.
- **CORS**: Cross-Origin Resource Sharing is configured on the backend to restrict API access to allowed frontend origins only.
- **SMTP** (optional): Email protocol for sending verification emails in production.
- **Twilio SMS API** (optional): For sending phone OTP verification messages in production.
- The application is a web-based system accessible through any modern web browser that supports HTML5, CSS3, JavaScript (ES6+), and WebSocket.

---

## 5 Other Nonfunctional Requirements

### 5.1 Performance Requirements

- **API Response Time**: REST API endpoints should respond within 200ms for standard CRUD operations under normal load.
- **WebSocket Latency**: Real-time messages (bid notifications, location updates) should be delivered within 500ms of generation.
- **Location Update Frequency**: Driver location updates are rate-limited to 60 per minute (once per second).
- **Concurrent Users**: The system should support at least 100 concurrent WebSocket connections per server instance.
- **Database Performance**: Optimistic locking and row-level locking (`SELECT FOR UPDATE`) ensure data consistency without significant performance degradation.
- **Frontend Load Time**: The Next.js application should achieve initial page load within 3 seconds on standard broadband connections.

### 5.2 Safety Requirements

- **OTP Verification**: The 6-digit OTP system ensures that only the correct passenger-driver pair can initiate a trip, preventing unauthorized pickups.
- **Emergency Contact**: Users can store emergency contact information (name, relationship, phone) in their profile for safety purposes.
- **Cancellation Penalties**: Late cancellation penalties discourage no-shows and protect both drivers and passengers.
- **Rate Limiting**: Rate limiting on all sensitive endpoints prevents abuse, denial-of-service attacks, and spam.

### 5.3 Security Requirements

- **Password Encryption**: All passwords are hashed using bcrypt with salt before storage. Plain-text passwords are never stored or logged.
- **JWT Authentication**: Stateless JWT tokens with configurable expiration are used for all authenticated endpoints. Tokens include the user ID and role.
- **CORS Policy**: The backend restricts CORS to explicitly configured origins. Wildcard (`*`) origins are not permitted in production.
- **Rate Limiting**: Comprehensive rate limiting is enforced across all sensitive endpoints:
  - Registration: 5/minute
  - Login: 10/minute
  - Bidding: 5/minute per driver
  - Trip creation: 5/minute
  - Trip cancellation: 10/minute
  - OTP verification: 5/minute
  - Health checks: 10/minute
- **Data Consistency**: Database transactions with `SELECT FOR UPDATE` row-level locking and optimistic locking (`version` columns) prevent race conditions and data corruption.
- **Payment Security**: Razorpay payment verification uses HMAC signature validation to ensure payment authenticity and prevent tampering.
- **WebSocket Security**: WebSocket connections require a valid JWT token passed as a query parameter for authentication.
- **Input Validation**: All API inputs are validated using Pydantic schemas to prevent injection attacks and malformed data.

### 5.4 Software Quality Attributes

- **AVAILABILITY**: Commuto is designed for 24/7 availability with Docker-based deployment supporting horizontal scaling.
- **CORRECTNESS**: The bidding system uses optimistic locking and database transactions to ensure correct state transitions and prevent race conditions.
- **MAINTAINABILITY**: The codebase follows a clean architecture with separation of concerns — routers, models, schemas, services, and authentication are in separate modules. PEP 8 (Python) and ESLint (TypeScript) standards are enforced.
- **USABILITY**: The frontend provides an intuitive, responsive UI with clear navigation, form validation, and real-time feedback via WebSocket notifications and Framer Motion animations.
- **TESTABILITY**: Comprehensive test coverage with backend unit tests (pytest) and frontend end-to-end tests (Playwright). Test suites cover authentication, rides, bids, OTP, WebSocket, and wallet flows.
- **SCALABILITY**: The architecture supports horizontal scaling via Docker containers, Redis-backed rate limiting, and PostgreSQL connection pooling.
- **RELIABILITY**: Proper error handling with database rollback on failures; auto-reconnecting WebSocket clients; and defensive coding with Pydantic validation.

---

## 6 Other Requirements

### Database Requirements

The system requires a PostgreSQL database with support for the following:
- **UUID primary keys** for all tables.
- **JSONB columns** for flexible data storage (user preferences, emergency contacts).
- **Row-level locking** (`SELECT FOR UPDATE`) for critical operations.
- **Version columns** for optimistic locking on Trip and TripBid tables.

### Deployment Requirements

- Docker and docker-compose are required for containerized deployment.
- The frontend uses Next.js standalone output mode for optimized production builds.
- Environment variables must be configured for database URL, JWT secret key, CORS origins, and Razorpay credentials.

### Internationalization

- The current version supports English language only.
- Currency is handled in INR (Indian Rupees) via Razorpay integration.

---

## 7 Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| **JWT** | JSON Web Token — a compact, URL-safe token format used for authentication. |
| **OTP** | One-Time Password — a 6-digit code used for trip verification at pickup. |
| **WebSocket** | A communication protocol providing full-duplex communication channels over a single TCP connection. |
| **Optimistic Locking** | A concurrency control method using version numbers to detect conflicting modifications. |
| **Razorpay** | An Indian payment gateway platform for processing online payments. |
| **FastAPI** | A modern Python web framework for building APIs with automatic interactive documentation. |
| **Next.js** | A React framework for server-side rendering and static site generation. |
| **SQLAlchemy** | A Python SQL toolkit and Object-Relational Mapping (ORM) library. |
| **Neon** | A serverless PostgreSQL hosting platform. |
| **CORS** | Cross-Origin Resource Sharing — a security mechanism for controlling cross-domain API access. |
| **Bid** | A price offer submitted by a driver on a passenger's ride request. |
| **Counter-Bid** | A modified price offer from a passenger in response to a driver's bid. |
| **Trip** | A ride request/journey record encompassing the full lifecycle from creation to completion. |

### Appendix B: Analysis Models

#### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                      Client (Browser)                    │
│  ┌────────────────────────────────────────────────────┐  │
│  │           Next.js 16 Frontend (React 19)           │  │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │  │
│  │  │ Auth     │ │ Ride     │ │ WebSocket Context  │  │  │
│  │  │ Context  │ │ Pages    │ │ (Auto-Reconnect)   │  │  │
│  │  └──────────┘ └──────────┘ └───────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────┬───────────────────┘
                       │ REST (HTTP)   │ WebSocket (WS)
┌──────────────────────▼───────────────▼───────────────────┐
│               FastAPI Backend Server                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Auth     │ │ Rides    │ │ Bids     │ │ WebSocket  │  │
│  │ Router   │ │ Router   │ │ Router   │ │ Manager    │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ OTP      │ │ Wallet   │ │ Payment  │ │ Rate       │  │
│  │ Router   │ │ Router   │ │ Methods  │ │ Limiter    │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
└──────────────────────┬───────────────────────────────────┘
                       │ SQLAlchemy ORM
┌──────────────────────▼───────────────────────────────────┐
│              PostgreSQL Database (Neon)                    │
│  ┌────────┐ ┌────────┐ ┌──────┐ ┌────────┐ ┌─────────┐ │
│  │ Users  │ │ Trips  │ │ Bids │ │Bookings│ │ Wallets │ │
│  ├───────────┤ ├───────────┤ ├──────┤ ├────────┤ ├────────────┤ │
│  │Drivers &  │ │Vehicles & │ │Saved │ │Payment │ │Transactions│ │
│  │Passengers │ │Locations  │ │Places│ │Methods │ │            │ │
│  └───────────┘ └───────────┘ └──────┘ └────────┘ └────────────┘ │
└──────────────────────────────────────────────────────────┘
        │                                    │
        ▼                                    ▼
┌──────────────┐                    ┌──────────────┐
│   Razorpay   │                    │ Google OAuth │
│   Payment    │                    │   Services   │
│   Gateway    │                    │              │
└──────────────┘                    └──────────────┘
```

#### Trip State Diagram

```
    ┌─────────┐
    │ PENDING │ ◄── Passenger creates ride request
    └────┬────┘
         │ Driver bids → Passenger accepts bid
         ▼
  ┌──────────────┐
  │ BID_ACCEPTED │ ◄── OTP generated, driver assigned
  └──────┬───────┘
         │ Driver verifies OTP at pickup
         ▼
    ┌─────────┐
    │ ACTIVE  │ ◄── Trip in progress, live tracking
    └────┬────┘
         │ Driver marks trip as completed
         ▼
  ┌───────────┐
  │ COMPLETED │ ◄── Fare deducted, receipt generated
  └───────────┘

  At any point before ACTIVE:
    ┌───────────┐
    │ CANCELLED │ ◄── Passenger or driver cancels
    └───────────┘
```

### Appendix C: Issues List

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 1 | Admin panel not yet implemented | Open | Optional feature, deferred to v2.0 |
| 2 | SMS OTP via Twilio is optional (dev mode uses inline OTP) | Open | Production deployment requires Twilio credentials |
| 3 | Email verification via SMTP is optional (dev mode returns token directly) | Open | Production deployment requires SMTP server |

---

**References**

- Project Repository: https://github.com/Aryan-B-Parikh/Commuto
- FastAPI Documentation: https://fastapi.tiangolo.com/
- Next.js Documentation: https://nextjs.org/docs
- Razorpay Documentation: https://razorpay.com/docs/api/
- Leaflet Documentation: https://leafletjs.com/reference.html
- SQLAlchemy Documentation: https://docs.sqlalchemy.org/en/20/
- IEEE 830-1998 Standard: https://standards.ieee.org/standard/830-1998.html
