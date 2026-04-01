# Commuto — Required APIs & Credentials

This file lists every external service and environment variable you need to run Commuto in production.  
For local development most features work without real credentials (the app falls back to dev-mode responses).

---

## 1. PostgreSQL Database

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Full connection string | `postgresql://user:pass@host:5432/db` |

**Where to get it:**
- Local: install PostgreSQL, create a DB, build the string yourself.
- Use a local connection string for development, e.g. `postgresql://postgres:password@localhost:5432/commuto`.

---

## 2. JWT / App Security

| Variable | Description | Example |
|---|---|---|
| `SECRET_KEY` | Long random string used to sign JWTs | `openssl rand -hex 32` |
| `APP_ENV` | `development` or `production` | `development` |
| `FRONTEND_URL` | Base URL of the Next.js app (used in email links) | `http://localhost:3000` |
| `APP_NAME` | Display name shown in emails / SMS | `Commuto` |

---

## 3. Twilio — SMS / Phone Verification

| Variable | Description |
|---|---|
| `TWILIO_ACCOUNT_SID` | Account SID from the Twilio console |
| `TWILIO_AUTH_TOKEN` | Auth token from the Twilio console |
| `TWILIO_PHONE_NUMBER` | A Twilio-purchased phone number (e.g. `+12025551234`) |

**How to get these:**
1. Sign up at <https://www.twilio.com> (free trial gives $15 test credit).
2. Go to **Console → Account Info** — copy **Account SID** and **Auth Token**.
3. Go to **Phone Numbers → Manage → Buy a Number** — buy an SMS-capable number.
4. Set all three variables in your `.env` file.

**Dev-mode fallback:**  
If these variables are absent and `APP_ENV=development`, the `/auth/send-phone-verification` endpoint returns the OTP directly in the JSON response (`dev_otp` field) instead of sending an SMS. The frontend shows it in an amber box.

---

## 4. SMTP — Email Verification & Notifications

| Variable | Description | Example |
|---|---|---|
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | Sender email address | `noreply@yourapp.com` |
| `SMTP_PASS` | SMTP password / app password | (see below) |
| `SMTP_FROM` | Display "From" address (optional, falls back to `SMTP_USER`) | `Commuto <noreply@yourapp.com>` |

**Provider options:**

| Provider | Notes |
|---|---|
| **Gmail** | Enable 2FA → generate an [App Password](https://myaccount.google.com/apppasswords). Use `smtp.gmail.com:587`. |
| **SendGrid** | Free 100 emails/day. SMTP credentials in Settings → API Keys. |
| **Mailgun** | Free 100 emails/day. SMTP credentials in Sending → Domain Settings. |
| **Resend** | Modern developer-focused service. Free 3,000 emails/month. |
| **AWS SES** | Cheapest at scale. Requires domain verification. |

**Dev-mode fallback:**  
If SMTP vars are absent and `APP_ENV=development`, the verification URL is returned in the API response as `dev_verify_url`. The frontend shows it in an amber box so you can click it directly.

---

## 5. Razorpay — Payments & Wallet

| Variable | Description |
|---|---|
| `RAZORPAY_KEY_ID` | Public key (starts with `rzp_test_` or `rzp_live_`) |
| `RAZORPAY_KEY_SECRET` | Private secret |

**How to get these:**
1. Sign up at <https://razorpay.com> (India-based; test mode available globally).
2. Go to **Settings → API Keys → Generate Test Key**.
3. Copy **Key ID** and **Key Secret**.
4. Switch to **live keys** before deploy; update `RAZORPAY_KEY_ID` accordingly.

> Note: Razorpay requires KYC (Indian bank account) for live payments. For international payments consider **Stripe** instead — the codebase can be adapted.

---

## 6. Google OAuth — Social Sign-In

| Variable | Where used | Description |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Backend `.env` | OAuth 2.0 client ID — used by `google-auth` to verify ID tokens on `POST /auth/google` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Frontend `.env.local` | Same client ID exposed to Next.js — passed to `<GoogleOAuthProvider>` in `layout.tsx` |

**How to get it:**
1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → Credentials**.
2. Click **Create Credentials → OAuth client ID**.
3. Application type: **Web application**.
4. Add authorised JavaScript origins: `http://localhost:3000` (dev) and your production URL.
5. Add authorised redirect URIs if you add server-side OAuth flows (not needed for the current token-based flow).
6. Copy the **Client ID** (looks like `xxxxxxxx.apps.googleusercontent.com`).
7. Enable the **Google Identity** API (also called *People API* or *OAuth 2.0* — it's on by default for web credentials).

**Dev-mode note:**  
Google OAuth requires a real Client ID even in development. The `@react-oauth/google` login button will silently fail if `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is empty or wrong. Use a real (but test-restricted) Client ID during local development.

---

## 7. Maps — Location & Routing (Optional / Future)

| Variable | Description |
|---|---|
| `GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API + Geocoding API |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Same key exposed to the Next.js frontend |

**How to get it:**
1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials.
2. Create an API key; restrict it to your domain.
3. Enable: **Maps JavaScript API**, **Geocoding API**, **Directions API**, **Places API**.

---

## 8. Sample `.env` Files

### `backend/.env`
```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/commuto

# App
SECRET_KEY=replace_with_32_char_random_hex
APP_ENV=development
FRONTEND_URL=http://localhost:3000
APP_NAME=Commuto

# Twilio (SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+12025551234

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx

# Google OAuth
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
```

### `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
```

---

## 9. Which Credentials Are Strictly Required?

| Service | Required to run locally? | Required in production? |
|---|---|---|
| PostgreSQL | ✅ Yes | ✅ Yes |
| `SECRET_KEY` | ✅ Yes | ✅ Yes |
| Google OAuth (`GOOGLE_CLIENT_ID`) | ✅ Yes (social login button won't work without it) | ✅ Yes |
| Twilio | ❌ No (dev fallback) | ✅ Yes |
| SMTP | ❌ No (dev fallback) | ✅ Yes |
| Razorpay | ❌ No (wallet features disabled) | ✅ Yes |
| Google Maps | ❌ No (map UI degraded) | Recommended |

---

## 10. Security Reminders

- **Never commit** `.env` or `.env.local` to git — both are already in `.gitignore`.
- Rotate `SECRET_KEY` to invalidate all existing JWTs when needed.
- Use **test-mode** Razorpay and Twilio keys during development.
- Set `APP_ENV=production` in production to disable all dev-mode fallbacks.
