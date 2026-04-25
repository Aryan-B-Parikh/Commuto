# Commuto — Production Deployment Guide

This guide outlines the recommended deployment strategy for Commuto using a split architecture:
- **Frontend:** Vercel (Optimized for Next.js, free tier, GitHub integration)
- **Backend:** Render (Free tier Web Service + Managed PostgreSQL, native Docker support)

---

## 1. Prerequisites

- A GitHub repository containing the Commuto source code
- Accounts on [Vercel](https://vercel.com) and [Render](https://render.com)
- Your environment variables ready (especially Gmail App Password, Ola Maps API key, Razorpay keys)

---

## 2. Deploying the Backend on Render

Render is ideal for the FastAPI backend because it natively builds from Dockerfiles and offers a managed PostgreSQL instance on the free tier.

### Step 2.1: Create the Database
1. Go to your Render Dashboard and click **New+** -> **PostgreSQL**.
2. Give it a name (e.g., `commuto-db`).
3. Choose the Free instance type.
4. Click **Create Database**.
5. Once created, copy the **Internal Database URL** (e.g., `postgresql://user:pass@host:5432/db`).

### Step 2.2: Deploy the Web Service
1. In the Render Dashboard, click **New+** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name:** `commuto-backend`
   - **Language:** Docker
   - **Root Directory:** `backend` *(Type exactly this. Do NOT include /Dockerfile here)*
   - **Dockerfile Path:** `./Dockerfile` *(This will appear after you select Docker as the language)*
   - **Branch:** `main`
4. Choose the Free instance type.
5. Click **Advanced** and scroll down to the **Environment Variables** section. You have two options:
   
   **Option A: Upload the `.env` file directly (Easiest)**
   Click the **"Add from .env"** button and select the `render.env` file located in the root folder of this project. Remember to update `DATABASE_URL` and `SECRET_KEY` inside that file before uploading it!

   **Option B: Add them manually**

| Key | Value |
|---|---|
| `DATABASE_URL` | *(Paste the Internal Database URL from Step 2.1)* |
| `SECRET_KEY` | *(Generate a strong 64-char random string)* |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` |
| `FRONTEND_URL` | *(Leave as placeholder until frontend is deployed, then update)* |
| `APP_ENV` | `production` |
| `APP_NAME` | `Commuto` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `aryanparik81006@gmail.com` |
| `SMTP_PASS` | `qziuoraijosjoghb` *(Your Gmail App Password)* |
| `EMAILJS_SERVICE_ID` | `service_wu86z4p` |
| `EMAILJS_TEMPLATE_ID` | `template_dfq9mib` |
| `EMAILJS_PUBLIC_KEY` | `BtsDI7cpnVsJNnOYR` |
| `RAZORPAY_KEY_ID` | `rzp_test_SAfXc12kNi31XZ` |
| `RAZORPAY_KEY_SECRET` | `X2Tnz72eYscHyhLXx2nvj669` |
| `GOOGLE_CLIENT_ID` | `85691434268-monrehdi463vf9qeun1961ulea5us8sm.apps.googleusercontent.com` |

6. Click **Create Web Service**.
7. Wait for the build and deployment to finish. 
8. Copy the Render URL (e.g., `https://commuto-backend.onrender.com`).
9. Verify by navigating to `https://commuto-backend.onrender.com/docs`.

*(Note: The database tables will be created automatically on startup due to `Base.metadata.create_all` in `main.py`.)*

---

## 3. Deploying the Frontend on Vercel

Vercel is the creator of Next.js and provides the absolute best hosting experience for the frontend.

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New** -> **Project**.
2. Import the `Commuto` GitHub repository.
3. Configure the project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend` (Click Edit and select the `frontend` folder)
4. Open the **Environment Variables** section. 
   
   **Pro Tip:** You can open the `vercel.env` file in the root of this project, copy all the text, and paste it directly into the first "Key" input box on Vercel. Vercel will automatically split it into all the separate key-value pairs!
   
   Just remember to update the `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` before you deploy.

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://commuto-backend.onrender.com` *(Your Render URL)* |
| `NEXT_PUBLIC_WS_URL` | `wss://commuto-backend.onrender.com` *(Your Render URL with wss://)* |
| `NEXT_PUBLIC_OLA_MAPS_API_KEY` | `UWkR4ThzYBIXLojFXFG1W62S6eGX5Y8qxqwCaXhn` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | *(Your Google Maps Key)* |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `85691434268-monrehdi463vf9qeun1961ulea5us8sm.apps.googleusercontent.com` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_test_SAfXc12kNi31XZ` |

5. Click **Deploy**.
6. Once deployed, Vercel will provide you with a production URL (e.g., `https://commuto-frontend.vercel.app`).

---

## 4. Final Configuration

Now that both services are live, you need to link them properly:

1. **Update Backend CORS & Frontend URL:**
   - Go to your Render Web Service dashboard -> Environment.
   - Update `FRONTEND_URL` to your Vercel URL (e.g., `https://commuto-frontend.vercel.app`).
   - Add `CORS_ALLOW_ORIGINS` and set it to your Vercel URL (e.g., `https://commuto-frontend.vercel.app`).
   - Render will automatically restart the service.

2. **Google Cloud Console:**
   - Go to your Google Cloud Console for the OAuth credentials.
   - Add your Vercel URL to the **Authorized JavaScript origins**.
   - Add your Vercel URL to the **Authorized redirect URIs**.

---

## 5. Post-Deployment Verification Checklist

| Task | Check |
|------|-------|
| ✅ Backend Health | Navigate to `https://commuto-backend.onrender.com/docs` and confirm the Swagger UI loads. |
| ✅ Frontend Loads | Navigate to your Vercel URL and ensure the app loads without errors. |
| ✅ Registration Flow | Sign up a new user and verify that the OTP email arrives via Gmail. |
| ✅ Login & JWT | Log in and confirm you are routed to the dashboard. |
| ✅ WebSocket | Open browser dev tools and check the Console/Network tab to ensure `wss://` connects successfully. |

## 6. Important Notes for Free Tiers

- **Render Cold Starts:** The free web service on Render spins down after 15 minutes of inactivity. When a new request comes in, it can take 30-60 seconds for the backend to wake up. This may cause the frontend to temporarily show connection errors on the first load of the day.
- **WebSocket Limits:** Render free tier supports WebSockets, but prolonged idle connections might be dropped. The frontend hook (`useTripWebSocket.ts`) has reconnect logic to handle this gracefully.
