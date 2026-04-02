import argparse
import asyncio
import json
import os
import sys
import threading
import time
import uuid
import hmac
import hashlib
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
import websockets
from sqlalchemy import text


ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from database import SessionLocal  # type: ignore
import models  # type: ignore


@dataclass
class CheckResult:
    name: str
    status: str  # PASS / FAIL / SKIP
    detail: str


class Reporter:
    def __init__(self) -> None:
        self.results: List[CheckResult] = []

    def pass_(self, name: str, detail: str) -> None:
        self.results.append(CheckResult(name=name, status="PASS", detail=detail))
        print(f"PASS | {name}: {detail}")

    def fail(self, name: str, detail: str) -> None:
        self.results.append(CheckResult(name=name, status="FAIL", detail=detail))
        print(f"FAIL | {name}: {detail}")

    def skip(self, name: str, detail: str) -> None:
        self.results.append(CheckResult(name=name, status="SKIP", detail=detail))
        print(f"SKIP | {name}: {detail}")

    def summarize(self) -> int:
        passed = sum(1 for r in self.results if r.status == "PASS")
        failed = sum(1 for r in self.results if r.status == "FAIL")
        skipped = sum(1 for r in self.results if r.status == "SKIP")

        print("\n=== MASTER FLOW SUMMARY ===")
        print(f"Total: {len(self.results)} | PASS: {passed} | FAIL: {failed} | SKIP: {skipped}")

        if failed:
            print("\nFailed checks:")
            for r in self.results:
                if r.status == "FAIL":
                    print(f"- {r.name}: {r.detail}")

        return 1 if failed else 0


class MasterFlowVerifier:
    def __init__(self, base_url: str, ws_url: str, timeout: float, auth_delay: float, razorpay_secret: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.ws_url = ws_url.rstrip("/")
        self.timeout = timeout
        self.auth_delay = auth_delay
        self.razorpay_secret = razorpay_secret
        self.http = requests.Session()
        self.report = Reporter()
        self.phone_counter = 0
        self.db_available, self.db_probe_error = self._probe_db()

    def _probe_db(self) -> tuple[bool, str]:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            return True, ""
        except Exception as exc:
            return False, str(exc)
        finally:
            db.close()

    def _phone(self) -> str:
        self.phone_counter += 1
        return f"95{self.phone_counter:08d}"

    def req(self, method: str, path: str, token: Optional[str] = None, **kwargs: Any) -> requests.Response:
        headers = kwargs.pop("headers", {})
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return self.http.request(
            method,
            f"{self.base_url}{path}",
            headers=headers,
            timeout=self.timeout,
            **kwargs,
        )

    def json_or_text(self, response: requests.Response) -> str:
        try:
            return json.dumps(response.json())
        except Exception:
            return response.text

    def register(self, role: str, tag: str) -> Dict[str, Any]:
        email = f"{role}_{tag}_{uuid.uuid4().hex[:6]}@example.com"
        password = "Password123!"
        payload: Dict[str, Any] = {
            "email": email,
            "password": password,
            "full_name": f"{role.title()} {tag}",
            "phone": self._phone(),
            "role": role,
        }
        if role == "driver":
            payload.update(
                {
                    "license_number": f"DL{uuid.uuid4().hex[:8]}",
                    "vehicle_make": "Hyundai",
                    "vehicle_model": "i20",
                    "vehicle_plate": f"MH01{uuid.uuid4().hex[:4].upper()}",
                    "vehicle_capacity": 4,
                }
            )

        rr = self.req("POST", "/auth/register", json=payload)
        if rr.status_code not in (200, 201):
            raise RuntimeError(f"register failed [{rr.status_code}] {self.json_or_text(rr)}")

        time.sleep(self.auth_delay)
        lr = self.req("POST", "/auth/login", json={"email": email, "password": password})
        if lr.status_code != 200:
            raise RuntimeError(f"login failed [{lr.status_code}] {self.json_or_text(lr)}")

        token = lr.json().get("access_token")
        if not token:
            raise RuntimeError("missing access_token")

        me = self.req("GET", "/auth/me", token=token)
        if me.status_code != 200:
            raise RuntimeError(f"/auth/me failed [{me.status_code}] {self.json_or_text(me)}")

        user = me.json()
        return {
            "email": email,
            "password": password,
            "token": token,
            "id": user.get("id"),
            "role": user.get("role"),
        }

    def create_shared(self, token: str, minutes_in_future: int = 120, price: float = 130.0) -> str:
        future = datetime.utcnow() + timedelta(minutes=minutes_in_future)
        payload = {
            "from_location": {"address": "Master A", "lat": 12.9716, "lng": 77.5946},
            "to_location": {"address": "Master B", "lat": 12.9352, "lng": 77.6245},
            "date": future.strftime("%Y-%m-%d"),
            "time": future.strftime("%H:%M"),
            "total_seats": 3,
            "price_per_seat": price,
            "notes": "master test ride",
        }
        resp = self.req("POST", "/rides/create-shared", token=token, json=payload)
        if resp.status_code != 201:
            raise RuntimeError(f"create-shared failed [{resp.status_code}] {self.json_or_text(resp)}")
        trip_id = resp.json().get("id")
        if not trip_id:
            raise RuntimeError("create-shared missing trip id")
        return trip_id

    def place_bid(self, token: str, trip_id: str, amount: float = 145.0) -> str:
        resp = self.req(
            "POST",
            f"/bids/{trip_id}",
            token=token,
            json={"amount": amount, "message": "master bid"},
        )
        if resp.status_code not in (200, 201):
            raise RuntimeError(f"place bid failed [{resp.status_code}] {self.json_or_text(resp)}")
        bid_id = resp.json().get("id")
        if not bid_id:
            raise RuntimeError("place bid missing bid id")
        return bid_id

    def db_lookup_user(self, email: str) -> Optional[models.User]:
        db = SessionLocal()
        try:
            return db.query(models.User).filter(models.User.email == email).first()
        finally:
            db.close()

    def set_wallet_balance(self, user_id: str, amount: float) -> None:
        if not self.db_available:
            raise RuntimeError("Direct DB access unavailable")
        db = SessionLocal()
        try:
            wallet = db.query(models.Wallet).filter(models.Wallet.user_id == user_id).first()
            if not wallet:
                wallet = models.Wallet(user_id=user_id, balance=amount)
                db.add(wallet)
            else:
                wallet.balance = amount
            db.commit()
        finally:
            db.close()

    def wallet_balance(self, user_id: str) -> float:
        if not self.db_available:
            raise RuntimeError("Direct DB access unavailable")
        db = SessionLocal()
        try:
            wallet = db.query(models.Wallet).filter(models.Wallet.user_id == user_id).first()
            return float(wallet.balance) if wallet else 0.0
        finally:
            db.close()

    def fund_wallet_via_api(self, token: str, amount: float) -> bool:
        if not self.razorpay_secret:
            return False

        add_resp = self.req("POST", "/wallet/add-money", token=token, json={"amount": amount})
        if add_resp.status_code not in (200, 201):
            return False

        try:
            order_id = add_resp.json().get("order_id")
        except Exception:
            return False

        if not order_id:
            return False

        payment_id = f"pay_{uuid.uuid4().hex[:12]}"
        signature = hmac.new(
            self.razorpay_secret.encode(),
            f"{order_id}|{payment_id}".encode(),
            hashlib.sha256,
        ).hexdigest()

        verify_resp = self.req(
            "POST",
            "/wallet/verify-payment",
            token=token,
            json={
                "razorpay_order_id": order_id,
                "razorpay_payment_id": payment_id,
                "razorpay_signature": signature,
            },
        )
        return verify_resp.status_code == 200

    def trip_and_live_location_counts(self, trip_id: str) -> Dict[str, int]:
        if not self.db_available:
            raise RuntimeError("Direct DB access unavailable")
        db = SessionLocal()
        try:
            trip_rows = db.query(models.TripLocation).filter(models.TripLocation.trip_id == trip_id).count()
            live_rows = db.query(models.LiveLocation).filter(models.LiveLocation.trip_id == trip_id).count()
            return {"trip_rows": trip_rows, "live_rows": live_rows}
        finally:
            db.close()

    async def ws_wait_for_new_ride(self, driver_token: str, trigger_fn) -> Optional[Dict[str, Any]]:
        url = f"{self.ws_url}/ws?token={driver_token}"
        async with websockets.connect(url) as ws:
            await asyncio.sleep(0.2)
            trigger_fn()
            deadline = time.time() + 8.0
            while time.time() < deadline:
                remaining = max(0.1, deadline - time.time())
                raw = await asyncio.wait_for(ws.recv(), timeout=remaining)
                msg = json.loads(raw)
                if msg.get("type") in ("new_ride_available", "new_ride_request"):
                    return msg
        return None

    def run(self) -> int:
        print("=== Commuto Master Flow Verifier ===")
        print(f"Base URL: {self.base_url}")
        print(f"WS URL: {self.ws_url}")

        health = self.req("GET", "/health")
        if health.status_code != 200:
            self.report.fail("Environment.Health", f"/health returned {health.status_code}: {self.json_or_text(health)}")
            return self.report.summarize()
        self.report.pass_("Environment.Health", "API and DB are reachable")

        if self.db_available:
            self.report.pass_("Environment.DBDirectAccess", "Direct SQL checks are available for deep validation")
        else:
            self.report.skip(
                "Environment.DBDirectAccess",
                f"Direct SQL checks disabled due DB auth/config mismatch: {self.db_probe_error}",
            )

        # ---- Identity & onboarding setup ----
        try:
            passenger = self.register("passenger", "creator")
            joiner = self.register("passenger", "joiner")
            driver = self.register("driver", "main")
            self.report.pass_("Identity.Register", "Created passenger/joiner/driver and authenticated")
        except Exception as exc:
            self.report.fail("Identity.Register", str(exc))
            return self.report.summarize()

        seeded_creator_balance = None
        seeded_joiner_balance = None
        if self.db_available:
            self.set_wallet_balance(passenger["id"], 1000.0)
            self.set_wallet_balance(joiner["id"], 1000.0)
            self.set_wallet_balance(driver["id"], 0.0)
            seeded_creator_balance = 1000.0
            seeded_joiner_balance = 1000.0
            self.report.pass_("Finance.PrepayFunding", "Wallet balances seeded before create/join prepayment checks")
        else:
            creator_funded = self.fund_wallet_via_api(passenger["token"], 1000.0)
            joiner_funded = self.fund_wallet_via_api(joiner["token"], 1000.0)
            if creator_funded and joiner_funded:
                p_wallet = self.req("GET", "/wallet", token=passenger["token"])
                j_wallet = self.req("GET", "/wallet", token=joiner["token"])
                seeded_creator_balance = float(p_wallet.json().get("balance", 0.0)) if p_wallet.status_code == 200 else None
                seeded_joiner_balance = float(j_wallet.json().get("balance", 0.0)) if j_wallet.status_code == 200 else None
                self.report.pass_("Finance.PrepayFunding", "Wallet top-up fallback succeeded via API")
            else:
                self.report.skip(
                    "Finance.PrepayFunding",
                    "Direct DB wallet seeding unavailable and API top-up fallback failed",
                )

        # Schema provisioning + password hashing check
        if self.db_available:
            db = SessionLocal()
            try:
                p_user = db.query(models.User).filter(models.User.email == passenger["email"]).first()
                d_user = db.query(models.User).filter(models.User.email == driver["email"]).first()
                p_profile = db.query(models.Passenger).filter(models.Passenger.user_id == p_user.id).first() if p_user else None
                d_profile = db.query(models.Driver).filter(models.Driver.user_id == d_user.id).first() if d_user else None

                if p_profile and d_profile:
                    self.report.pass_("Identity.RoleProvisioning", "Passenger and Driver profiles exist in PostgreSQL")
                else:
                    self.report.fail("Identity.RoleProvisioning", "Missing passenger or driver profile row")

                if p_user and p_user.hashed_password and p_user.hashed_password != "Password123!" and p_user.hashed_password.startswith("$2"):
                    self.report.pass_("Identity.PasswordHashing", "Password stored as bcrypt hash, not plain text")
                else:
                    self.report.fail("Identity.PasswordHashing", "Password hash check failed")
            finally:
                db.close()
        else:
            self.report.skip("Identity.RoleProvisioning", "Skipped because direct DB connection is unavailable")
            self.report.skip("Identity.PasswordHashing", "Skipped because direct DB connection is unavailable")

        # Duplicate email uniqueness
        dup_payload = {
            "email": passenger["email"],
            "password": "Password123!",
            "full_name": "Duplicate",
            "phone": self._phone(),
            "role": "passenger",
        }
        dup_resp = self.req("POST", "/auth/register", json=dup_payload)
        if dup_resp.status_code == 400 and "already" in self.json_or_text(dup_resp).lower():
            self.report.pass_("Identity.EmailUniqueness", "Duplicate email registration is blocked")
        else:
            self.report.fail("Identity.EmailUniqueness", f"Unexpected duplicate response: {dup_resp.status_code} {self.json_or_text(dup_resp)}")

        # Email verification flow
        send_email = self.req("POST", "/auth/send-verification", token=passenger["token"])
        if send_email.status_code == 200:
            body = send_email.json()
            dev_token = body.get("dev_token")
            if dev_token:
                verify_email = self.req("POST", "/auth/verify-email", json={"token": dev_token})
                if verify_email.status_code == 200 and verify_email.json().get("is_verified") is True:
                    self.report.pass_("Identity.EmailVerification", "Email dev-token verification works")
                else:
                    self.report.fail(
                        "Identity.EmailVerification",
                        f"Email verification failed: {verify_email.status_code} {self.json_or_text(verify_email)}",
                    )
            else:
                self.report.skip("Identity.EmailVerification", "SMTP path active (no dev token returned), manual inbox verification required")
        else:
            self.report.skip("Identity.EmailVerification", f"Email verification endpoint unavailable: {send_email.status_code}")

        # Phone verification flow
        send_phone = self.req("POST", "/auth/send-phone-verification", token=passenger["token"])
        if send_phone.status_code == 200:
            body = send_phone.json()
            dev_otp = body.get("dev_otp")
            if dev_otp:
                verify_phone = self.req("POST", "/auth/verify-phone", token=passenger["token"], json={"otp": dev_otp})
                if verify_phone.status_code == 200 and verify_phone.json().get("is_phone_verified") is True:
                    self.report.pass_("Identity.PhoneVerification", "Phone OTP verification works")
                else:
                    self.report.fail(
                        "Identity.PhoneVerification",
                        f"Phone verification failed: {verify_phone.status_code} {self.json_or_text(verify_phone)}",
                    )
            else:
                self.report.skip("Identity.PhoneVerification", "Twilio path active (no dev OTP returned), manual SMS verification required")
        else:
            self.report.skip("Identity.PhoneVerification", f"Phone verification endpoint unavailable: {send_phone.status_code}")

        # Google OAuth behavior (code-level check for role prompt)
        auth_router_src = (BACKEND_DIR / "routers" / "auth_router.py").read_text(encoding="utf-8", errors="ignore")
        default_role_pattern = 'requested_role = auth_data.role if auth_data.role in ["passenger", "driver"] else "passenger"'
        if default_role_pattern in auth_router_src:
            self.report.fail(
                "Identity.GoogleOAuthRoleSelection",
                "Backend auto-assigns default passenger role when role is missing instead of forcing explicit role selection",
            )
        else:
            self.report.skip(
                "Identity.GoogleOAuthRoleSelection",
                "Static source check is best-effort; validate /auth/google behavior in an integration test",
            )

        # ---- Marketplace flow ----
        try:
            primary_trip = self.create_shared(passenger["token"], minutes_in_future=120, price=130.0)
            self.report.pass_("Marketplace.CreateRide", f"Created shared ride {primary_trip}")
        except Exception as exc:
            self.report.fail("Marketplace.CreateRide", str(exc))
            return self.report.summarize()

        # Real-time broadcast on ride creation
        try:
            def trigger_create() -> None:
                self.create_shared(passenger["token"], minutes_in_future=150, price=131.0)

            event = asyncio.run(self.ws_wait_for_new_ride(driver["token"], trigger_create))
            if event:
                self.report.pass_("Marketplace.WebSocketNewRide", f"Driver received event type={event.get('type')}")
            else:
                self.report.fail("Marketplace.WebSocketNewRide", "No new ride event received within timeout")
        except Exception as exc:
            self.report.fail("Marketplace.WebSocketNewRide", str(exc))

        # Time validation (past ride)
        past = datetime.utcnow() - timedelta(minutes=10)
        past_payload = {
            "from_location": {"address": "Past A", "lat": 12.9716, "lng": 77.5946},
            "to_location": {"address": "Past B", "lat": 12.9352, "lng": 77.6245},
            "date": past.strftime("%Y-%m-%d"),
            "time": past.strftime("%H:%M"),
            "total_seats": 2,
            "price_per_seat": 120,
        }
        past_resp = self.req("POST", "/rides/create-shared", token=passenger["token"], json=past_payload)
        if past_resp.status_code == 400 and "future" in self.json_or_text(past_resp).lower():
            self.report.pass_("Marketplace.PastTimeValidation", "Past departure is rejected")
        else:
            self.report.fail("Marketplace.PastTimeValidation", f"Unexpected response: {past_resp.status_code} {self.json_or_text(past_resp)}")

        # create-shared endpoint has 5/min limit; reset window before creating more rides
        print("INFO | Waiting 61s to reset create-shared rate limit window...")
        time.sleep(61)

        # Join flow and bid flow
        join_resp = self.req("POST", f"/rides/{primary_trip}/join", token=joiner["token"], json={"notes": "join for settlement"})
        if join_resp.status_code == 200:
            self.report.pass_("Marketplace.JoinRide", "Second passenger joined shared ride")
        else:
            self.report.fail("Marketplace.JoinRide", f"Join failed: {join_resp.status_code} {self.json_or_text(join_resp)}")

        try:
            bid_id = self.place_bid(driver["token"], primary_trip, amount=140.0)
            self.report.pass_("Marketplace.PlaceBid", f"Driver placed bid {bid_id}")
        except Exception as exc:
            self.report.fail("Marketplace.PlaceBid", str(exc))
            return self.report.summarize()

        # Counter-bid linkage
        counter_resp = self.req("POST", f"/bids/{bid_id}/counter", token=passenger["token"], json={"amount": 135.0, "message": "counter"})
        if counter_resp.status_code in (200, 201):
            data = counter_resp.json()
            if data.get("is_counter_bid") and str(data.get("parent_bid_id")) == str(bid_id):
                self.report.pass_("Marketplace.CounterBidLinking", "Counter bid links to parent bid id correctly")
            else:
                self.report.fail("Marketplace.CounterBidLinking", f"Unexpected counter linkage payload: {data}")
            active_bid_id = data.get("id")
        else:
            self.report.fail("Marketplace.CounterBidLinking", f"Counter bid failed: {counter_resp.status_code} {self.json_or_text(counter_resp)}")
            active_bid_id = bid_id

        # Self-bidding edge case
        try:
            self_bid_user = self.register("driver", "selfbid")
            if self.db_available:
                self.set_wallet_balance(self_bid_user["id"], 1000.0)
            else:
                self.fund_wallet_via_api(self_bid_user["token"], 1000.0)
            self_trip = self.create_shared(self_bid_user["token"], minutes_in_future=90, price=110.0)
            self_bid = self.req("POST", f"/bids/{self_trip}", token=self_bid_user["token"], json={"amount": 111, "message": "self"})
            if self_bid.status_code == 400 and "own trip" in self.json_or_text(self_bid).lower():
                self.report.pass_("Marketplace.SelfBiddingBlocked", "Driver cannot bid on own ride where already passenger")
            else:
                self.report.fail("Marketplace.SelfBiddingBlocked", f"Unexpected self-bid response: {self_bid.status_code} {self.json_or_text(self_bid)}")
        except Exception as exc:
            self.report.fail("Marketplace.SelfBiddingBlocked", str(exc))

        # Concurrency/optimistic locking behavior on bid acceptance
        accept_results: List[Dict[str, Any]] = []
        accept_lock = threading.Lock()
        barrier = threading.Barrier(2)

        def accept_worker() -> None:
            try:
                barrier.wait(timeout=5)
                r = requests.post(
                    f"{self.base_url}/bids/{active_bid_id}/accept",
                    headers={"Authorization": f"Bearer {passenger['token']}"},
                    timeout=self.timeout,
                )
                payload = r.json() if r.headers.get("content-type", "").startswith("application/json") else {"detail": r.text}
                with accept_lock:
                    accept_results.append({"status": r.status_code, "body": payload})
            except Exception as exc:
                with accept_lock:
                    accept_results.append({"status": -1, "body": {"detail": str(exc)}})

        t1 = threading.Thread(target=accept_worker)
        t2 = threading.Thread(target=accept_worker)
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        success_count = sum(1 for r in accept_results if r["status"] == 200)
        failure_count = sum(1 for r in accept_results if r["status"] in (400, 409))
        if success_count == 1 and failure_count == 1:
            self.report.pass_("Marketplace.ConcurrentAccept", f"Exactly one accept succeeded, one rejected: {accept_results}")
        else:
            self.report.fail("Marketplace.ConcurrentAccept", f"Unexpected concurrent accept result: {accept_results}")

        accepted_payload = next((r["body"] for r in accept_results if r["status"] == 200), {})
        otp = accepted_payload.get("otp")

        # Bid event broadcast to passenger check (code-level check)
        bids_src = (BACKEND_DIR / "routers" / "bids_router.py").read_text(encoding="utf-8", errors="ignore")
        if "notify_new_bid(" in bids_src:
            self.report.pass_("Marketplace.NewBidRealtime", "Bid placement appears to call websocket notifier")
        else:
            self.report.fail("Marketplace.NewBidRealtime", "No websocket notification call found in bid placement/counter flow")

        # Bid rate-limit check: keep placing on same trip until 429
        hit_bid_rate_limit = False
        for _ in range(12):
            r = self.req("POST", f"/bids/{primary_trip}", token=driver["token"], json={"amount": 150, "message": "spam"})
            if r.status_code == 429:
                hit_bid_rate_limit = True
                break
        if hit_bid_rate_limit:
            self.report.pass_("Marketplace.BidRateLimit", "Bid endpoint enforces 5/minute limit")
        else:
            self.report.fail("Marketplace.BidRateLimit", "Did not hit bid rate limit within expected attempts")

        # ---- OTP / telemetry flow ----
        if not otp:
            self.report.fail("Execution.OTPHandshake", "No OTP available from accepted bid")
            return self.report.summarize()

        completion_otp = None
        verify_once = self.req("POST", f"/rides/{primary_trip}/verify-otp", token=driver["token"], json={"otp": otp})
        if verify_once.status_code == 200:
            completion_otp = verify_once.json().get("completion_otp")
            if completion_otp:
                self.report.pass_("Execution.OTPHandshake", "Driver OTP verification starts ride and returns drop OTP")
            else:
                self.report.fail("Execution.OTPHandshake", "Start OTP verified but completion OTP was not issued")
                return self.report.summarize()
        else:
            self.report.fail("Execution.OTPHandshake", f"OTP verification failed: {verify_once.status_code} {self.json_or_text(verify_once)}")
            return self.report.summarize()

        verify_twice = self.req("POST", f"/rides/{primary_trip}/verify-otp", token=driver["token"], json={"otp": otp})
        if verify_twice.status_code == 400 and "already" in self.json_or_text(verify_twice).lower():
            self.report.pass_("Execution.DoubleOTPVerification", "Second OTP verification attempt is blocked")
        else:
            self.report.fail(
                "Execution.DoubleOTPVerification",
                f"Unexpected second-verify response: {verify_twice.status_code} {self.json_or_text(verify_twice)}",
            )

        # location persistence checks
        if self.db_available:
            before_counts = self.trip_and_live_location_counts(primary_trip)
        else:
            before_history = self.req("GET", f"/rides/{primary_trip}/locations", token=passenger["token"])
            before_counts = {
                "trip_rows": len(before_history.json()) if before_history.status_code == 200 else 0,
                "live_rows": -1,
            }

        for idx in range(3):
            lr = self.req(
                "POST",
                f"/rides/{primary_trip}/location",
                token=driver["token"],
                json={"lat": 12.97 + idx * 0.0001, "lng": 77.59 + idx * 0.0001},
            )
            if lr.status_code != 200:
                self.report.fail("Execution.LocationUpdate", f"Location update failed at idx={idx}: {lr.status_code} {self.json_or_text(lr)}")
                break
        else:
            self.report.pass_("Execution.LocationUpdate", "Driver location POST accepted during active trip")

        if self.db_available:
            after_counts = self.trip_and_live_location_counts(primary_trip)
        else:
            after_history = self.req("GET", f"/rides/{primary_trip}/locations", token=passenger["token"])
            after_counts = {
                "trip_rows": len(after_history.json()) if after_history.status_code == 200 else before_counts["trip_rows"],
                "live_rows": -1,
            }

        if after_counts["trip_rows"] > before_counts["trip_rows"]:
            self.report.pass_("Execution.TripLocationPersistence", "TripLocation history rows appended")
        else:
            self.report.fail("Execution.TripLocationPersistence", "TripLocation rows did not increase")

        rides_src = (BACKEND_DIR / "routers" / "rides_router.py").read_text(encoding="utf-8", errors="ignore")
        if "models.LiveLocation" in rides_src and "/{trip_id}/location" in rides_src:
            self.report.pass_("Execution.LiveLocationPersistence", "Detected LiveLocation handling in location endpoint")
        else:
            self.report.fail(
                "Execution.LiveLocationPersistence",
                "POST /rides/{trip_id}/location does not persist LiveLocation (latest coordinate table)",
            )

        # telemetry rate limit (>60/min)
        got_429 = False
        for i in range(70):
            lr = self.req(
                "POST",
                f"/rides/{primary_trip}/location",
                token=driver["token"],
                json={"lat": 13.0 + i * 0.00001, "lng": 77.6 + i * 0.00001},
            )
            if lr.status_code == 429:
                got_429 = True
                break
        if got_429:
            self.report.pass_("Execution.LocationRateLimit", "Telemetry updates are rate limited above 60/min")
        else:
            self.report.fail("Execution.LocationRateLimit", "Did not hit telemetry rate limit within expected attempts")

        # Frontend reconnect policy audit
        trip_ws_src = (ROOT / "frontend" / "src" / "hooks" / "useTripWebSocket.ts").read_text(encoding="utf-8", errors="ignore")
        if "setTimeout(() => {" in trip_ws_src and "}, 3000);" in trip_ws_src and "Math.pow" not in trip_ws_src:
            self.report.fail(
                "Execution.WebSocketReconnectBackoff",
                "Trip websocket reconnect uses fixed 3000ms delay, not exponential backoff",
            )
        else:
            self.report.pass_("Execution.WebSocketReconnectBackoff", "Exponential/variable reconnect strategy detected")

        # ---- Financial settlement flow ----

        p_wallet_before = self.req("GET", "/wallet", token=passenger["token"])
        j_wallet_before = self.req("GET", "/wallet", token=joiner["token"])
        d_wallet_before = self.req("GET", "/wallet", token=driver["token"])

        p_before = float(p_wallet_before.json().get("balance", 0.0)) if p_wallet_before.status_code == 200 else 0.0
        j_before = float(j_wallet_before.json().get("balance", 0.0)) if j_wallet_before.status_code == 200 else 0.0
        d_before = float(d_wallet_before.json().get("balance", 0.0)) if d_wallet_before.status_code == 200 else 0.0

        complete = self.req(
            "POST",
            f"/rides/{primary_trip}/complete",
            token=driver["token"],
            json={"otp": completion_otp},
        )
        if complete.status_code == 200:
            self.report.pass_("Finance.CompleteRide", "Driver completed ride successfully")
        else:
            self.report.fail("Finance.CompleteRide", f"Complete ride failed: {complete.status_code} {self.json_or_text(complete)}")

        p_wallet_after = self.req("GET", "/wallet", token=passenger["token"])
        j_wallet_after = self.req("GET", "/wallet", token=joiner["token"])
        d_wallet_after = self.req("GET", "/wallet", token=driver["token"])

        p_after = float(p_wallet_after.json().get("balance", 0.0)) if p_wallet_after.status_code == 200 else p_before
        j_after = float(j_wallet_after.json().get("balance", 0.0)) if j_wallet_after.status_code == 200 else j_before
        d_after = float(d_wallet_after.json().get("balance", 0.0)) if d_wallet_after.status_code == 200 else d_before

        if seeded_creator_balance is not None and seeded_joiner_balance is not None:
            if p_before < seeded_creator_balance and j_before < seeded_joiner_balance:
                self.report.pass_(
                    "Finance.PrepayDeduction",
                    f"Passenger wallets were deducted before completion: creator {seeded_creator_balance}->{p_before}, joiner {seeded_joiner_balance}->{j_before}",
                )
            else:
                self.report.fail(
                    "Finance.PrepayDeduction",
                    f"Missing prepay deduction before completion: creator {seeded_creator_balance}->{p_before}, joiner {seeded_joiner_balance}->{j_before}",
                )
        elif not self.db_available and p_before == 0 and j_before == 0:
            self.report.skip(
                "Finance.PrepayDeduction",
                "Cannot deterministically assert prepay deduction without DB seeding or external top-up in this environment",
            )
        else:
            self.report.fail("Finance.PrepayDeduction", f"Unable to assert prepay deduction: creator={p_before}, joiner={j_before}")

        if abs(p_after - p_before) < 0.01 and abs(j_after - j_before) < 0.01:
            self.report.pass_(
                "Finance.NoPostRidePassengerDebit",
                f"No extra passenger debit on completion: creator {p_before}->{p_after}, joiner {j_before}->{j_after}",
            )
        else:
            self.report.fail(
                "Finance.NoPostRidePassengerDebit",
                f"Passenger wallets changed unexpectedly at completion: creator {p_before}->{p_after}, joiner {j_before}->{j_after}",
            )

        # Driver credit expectation from business requirement
        if d_after > d_before:
            self.report.pass_("Finance.DriverSettlement", f"Driver wallet credited: {d_before}->{d_after}")
        elif not self.db_available and p_before <= 0 and j_before <= 0:
            self.report.skip(
                "Finance.DriverSettlement",
                "Cannot assert driver credit without funded passenger wallets in API-only mode",
            )
        else:
            self.report.fail("Finance.DriverSettlement", f"Driver wallet not credited: {d_before}->{d_after}")

        # Ledger integrity via wallet transaction API
        p_txs = self.req("GET", "/wallet/transactions", token=passenger["token"])
        j_txs = self.req("GET", "/wallet/transactions", token=joiner["token"])
        if p_txs.status_code == 200 and j_txs.status_code == 200:
            def has_payment(items: List[Dict[str, Any]]) -> bool:
                return any(i.get("type") == "payment" and i.get("status") == "completed" for i in items)

            if has_payment(p_txs.json()) and has_payment(j_txs.json()):
                self.report.pass_("Finance.LedgerIntegrity", "Transaction ledger entries exist for passenger settlements")
            else:
                self.report.fail("Finance.LedgerIntegrity", "Expected settlement transactions not found in wallet history")
        else:
            self.report.fail(
                "Finance.LedgerIntegrity",
                f"Could not fetch wallet transactions: creator={p_txs.status_code}, joiner={j_txs.status_code}",
            )

        # Wallet Razorpay spoof signature
        spoof = self.req(
            "POST",
            "/wallet/verify-payment",
            token=passenger["token"],
            json={
                "razorpay_order_id": f"order_{uuid.uuid4().hex[:10]}",
                "razorpay_payment_id": f"pay_{uuid.uuid4().hex[:10]}",
                "razorpay_signature": "deadbeef",
            },
        )
        if spoof.status_code == 400 and "invalid payment signature" in self.json_or_text(spoof).lower():
            self.report.pass_("Finance.RazorpayHmacValidation", "Spoofed signature rejected")
        elif spoof.status_code == 503:
            self.report.skip("Finance.RazorpayHmacValidation", "Payment service not configured in this environment")
        else:
            self.report.fail("Finance.RazorpayHmacValidation", f"Unexpected spoof validation response: {spoof.status_code} {self.json_or_text(spoof)}")

        # Cancellation penalty (late cancellation within 30 minutes)
        try:
            late_trip = self.create_shared(passenger["token"], minutes_in_future=10, price=150.0)
            cancel = self.req("POST", f"/rides/{late_trip}/cancel", token=passenger["token"])
            if cancel.status_code == 200 and float(cancel.json().get("penalty_amount", 0)) > 0:
                self.report.pass_("Finance.CancellationPenalty", f"Late cancellation penalty applied: {cancel.json().get('penalty_amount')}")
            else:
                self.report.fail("Finance.CancellationPenalty", f"Unexpected cancellation response: {cancel.status_code} {self.json_or_text(cancel)}")
        except Exception as exc:
            self.report.fail("Finance.CancellationPenalty", str(exc))

        # ---- Rate limit explicit stress (run last to avoid affecting prior setup) ----
        # Login rate limit (10/min)
        login_hit = False
        for _ in range(20):
            lr = self.req(
                "POST",
                "/auth/login",
                json={"email": passenger["email"], "password": "WrongPassword123!"},
            )
            if lr.status_code == 429:
                login_hit = True
                break
        if login_hit:
            self.report.pass_("Identity.LoginRateLimit", "Login attempts are limited")
        else:
            self.report.fail("Identity.LoginRateLimit", "Could not trigger login rate limit within expected attempts")

        # Register rate limit (5/min)
        register_hit = False
        for idx in range(20):
            payload = {
                "email": f"ratelimit_{idx}_{uuid.uuid4().hex[:6]}@example.com",
                "password": "Password123!",
                "full_name": f"Rate Limit {idx}",
                "phone": self._phone(),
                "role": "passenger",
            }
            rr = self.req("POST", "/auth/register", json=payload)
            if rr.status_code == 429:
                register_hit = True
                break
        if register_hit:
            self.report.pass_("Identity.RegisterRateLimit", "Registration attempts are limited")
        else:
            self.report.fail("Identity.RegisterRateLimit", "Could not trigger register rate limit within expected attempts")

        return self.report.summarize()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run comprehensive Commuto master flow checks")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000", help="Backend base URL")
    parser.add_argument("--ws-url", default="ws://127.0.0.1:8000", help="WebSocket base URL")
    parser.add_argument("--timeout", type=float, default=20.0, help="HTTP timeout seconds")
    parser.add_argument("--auth-delay", type=float, default=1.2, help="Delay between register/login")
    parser.add_argument(
        "--razorpay-secret",
        default=os.getenv("RAZORPAY_KEY_SECRET", ""),
        help="Razorpay secret for API wallet top-up fallback when DB access is unavailable",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    verifier = MasterFlowVerifier(args.base_url, args.ws_url, args.timeout, args.auth_delay, args.razorpay_secret)
    raise SystemExit(verifier.run())
