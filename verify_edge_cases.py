import argparse
import os
import sys
import threading
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import requests
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
    status: str
    detail: str


class Reporter:
    def __init__(self) -> None:
        self.results: list[CheckResult] = []

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

        print("\n=== EDGE CASE SUMMARY ===")
        print(f"Total: {len(self.results)} | PASS: {passed} | FAIL: {failed} | SKIP: {skipped}")

        if failed:
            print("\nFailed checks:")
            for r in self.results:
                if r.status == "FAIL":
                    print(f"- {r.name}: {r.detail}")

        return 1 if failed else 0


class EdgeCaseVerifier:
    def __init__(self, base_url: str, timeout: float) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.http = requests.Session()
        self.report = Reporter()
        self.register_calls = 0
        self.login_calls = 0
        self.bid_calls = 0
        self.db_available, self.db_probe_error = self._probe_db()

    def _probe_db(self) -> Tuple[bool, str]:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            return True, ""
        except Exception as exc:
            return False, str(exc)
        finally:
            db.close()

    def req(self, method: str, path: str, token: Optional[str] = None, **kwargs: Any) -> requests.Response:
        headers = kwargs.pop("headers", {})
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return self.http.request(method, f"{self.base_url}{path}", headers=headers, timeout=self.timeout, **kwargs)

    def _create_user(self, role: str, tag: str) -> Dict[str, Any]:
        email = f"edge_{role}_{tag}_{uuid.uuid4().hex[:6]}@example.com"
        payload: Dict[str, Any] = {
            "email": email,
            "password": "Password123!",
            "full_name": f"Edge {role.title()} {tag}",
            "phone": f"95{uuid.uuid4().int % 10_000_000_000:010d}",
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

        resp = self.req("POST", "/auth/register", json=payload)
        self.register_calls += 1
        if resp.status_code not in (200, 201):
            raise RuntimeError(f"register failed [{resp.status_code}] {resp.text}")

        login = self.req("POST", "/auth/login", json={"email": email, "password": payload["password"]})
        self.login_calls += 1
        if login.status_code != 200:
            raise RuntimeError(f"login failed [{login.status_code}] {login.text}")

        token = login.json().get("access_token")
        if not token:
            raise RuntimeError("missing access_token")

        me = self.req("GET", "/auth/me", token=token)
        if me.status_code != 200:
            raise RuntimeError(f"/auth/me failed [{me.status_code}] {me.text}")
        user_id = me.json().get("id")
        if not user_id:
            raise RuntimeError("missing user id")

        return {"email": email, "token": token, "id": user_id}

    def _set_wallet_balance(self, user_id: str, amount: float) -> None:
        if not self.db_available:
            raise RuntimeError("DB unavailable")
        user_uuid = uuid.UUID(user_id)
        db = SessionLocal()
        try:
            wallet = db.query(models.Wallet).filter(models.Wallet.user_id == user_uuid).first()
            if not wallet:
                wallet = models.Wallet(user_id=user_uuid, balance=amount)
                db.add(wallet)
            else:
                wallet.balance = amount
            db.commit()
        finally:
            db.close()

    def _create_shared(self, token: str, *, total_seats: int, notes: Optional[str] = None, date: Optional[str] = None, time_str: str = "14:00") -> requests.Response:
        payload = {
            "from_location": {"address": "Edge Start", "lat": 12.9716, "lng": 77.5946},
            "to_location": {"address": "Edge End", "lat": 12.9352, "lng": 77.6245},
            "date": date or (datetime.utcnow() + timedelta(days=2)).strftime("%Y-%m-%d"),
            "time": time_str,
            "total_seats": total_seats,
            "price_per_seat": 45.0,
        }
        if notes is not None:
            payload["notes"] = notes
        return self.req("POST", "/rides/create-shared", token=token, json=payload)

    def _place_bid(self, token: str, trip_id: str, amount: float, message: Optional[str] = None) -> requests.Response:
        payload = {"amount": amount}
        if message is not None:
            payload["message"] = message
        resp = self.req("POST", f"/bids/{trip_id}", token=token, json=payload)
        self.bid_calls += 1
        return resp

    def _accept_bid(self, token: str, bid_id: str) -> requests.Response:
        return self.req("POST", f"/bids/{bid_id}/accept", token=token)

    def _start_trip(self, token: str, trip_id: str, otp: str) -> requests.Response:
        return self.req("POST", f"/rides/{trip_id}/verify-otp", token=token, json={"otp": otp})

    def _setup_active_trip(self, passenger_token: str, driver_token: str) -> tuple[str, str]:
        trip_resp = self._create_shared(passenger_token, total_seats=2)
        if trip_resp.status_code != 201:
            raise RuntimeError(f"failed to create trip: {trip_resp.status_code} {trip_resp.text}")
        trip_id = trip_resp.json()["id"]

        bid_resp = self._place_bid(driver_token, trip_id, 20.0)
        if bid_resp.status_code not in (200, 201):
            raise RuntimeError(f"failed to place bid: {bid_resp.status_code} {bid_resp.text}")
        bid_id = bid_resp.json()["id"]

        accept_resp = self._accept_bid(passenger_token, bid_id)
        if accept_resp.status_code != 200:
            raise RuntimeError(f"failed to accept bid: {accept_resp.status_code} {accept_resp.text}")
        otp = accept_resp.json().get("otp")

        start_resp = self._start_trip(driver_token, trip_id, otp)
        if start_resp.status_code != 200:
            raise RuntimeError(f"failed to start trip: {start_resp.status_code} {start_resp.text}")
        return trip_id, otp

    def run(self) -> int:
        print("=== Commuto Edge Case Verifier ===")
        print(f"Base URL: {self.base_url}")

        health = self.req("GET", "/health")
        if health.status_code != 200:
            self.report.fail("Environment.Health", f"/health returned {health.status_code}: {health.text}")
            return self.report.summarize()
        self.report.pass_("Environment.Health", "API reachable")

        if self.db_available:
            self.report.pass_("Environment.DBDirectAccess", "DB connectivity available")
        else:
            self.report.skip("Environment.DBDirectAccess", f"DB unavailable: {self.db_probe_error}")

        # Invalid email
        bad_email = self.req(
            "POST",
            "/auth/register",
            json={
                "email": "not-an-email",
                "password": "Password123!",
                "full_name": "Bad Email",
                "phone": "9999999999",
                "role": "passenger",
            },
        )
        self.register_calls += 1
        if bad_email.status_code == 422:
            self.report.pass_("Validation.InvalidEmail", "Malformed email rejected by schema")
        else:
            self.report.fail("Validation.InvalidEmail", f"Expected 422, got {bad_email.status_code}")

        # Create users
        try:
            passenger = self._create_user("passenger", "edge")
            driver = self._create_user("driver", "edge")
            self.report.pass_("Identity.Register", "Passenger + driver registered")
        except Exception as exc:
            self.report.fail("Identity.Register", str(exc))
            return self.report.summarize()

        if self.db_available:
            try:
                self._set_wallet_balance(passenger["id"], 1000.0)
                self._set_wallet_balance(driver["id"], 1000.0)
            except Exception as exc:
                self.report.fail("Finance.WalletSeed", str(exc))

        # Negative amounts
        neg_wallet = self.req("POST", "/wallet/add-money", token=passenger["token"], json={"amount": -1})
        if neg_wallet.status_code == 422:
            self.report.pass_("Finance.WalletNegative", "Negative wallet top-up rejected")
        else:
            self.report.fail("Finance.WalletNegative", f"Expected 422, got {neg_wallet.status_code}")

        # Insufficient funds
        if self.db_available:
            try:
                self._set_wallet_balance(passenger["id"], 0.0)
                low_funds = self._create_shared(passenger["token"], total_seats=2)
                if low_funds.status_code == 400:
                    self.report.pass_("Finance.InsufficientFunds", "Ride creation blocked on low balance")
                else:
                    self.report.fail("Finance.InsufficientFunds", f"Expected 400, got {low_funds.status_code}")
                self._set_wallet_balance(passenger["id"], 1000.0)
            except Exception as exc:
                self.report.fail("Finance.InsufficientFunds", str(exc))
        else:
            self.report.skip("Finance.InsufficientFunds", "DB unavailable to manipulate balances")

        # HMAC spoof
        if self.db_available:
            try:
                os.environ.setdefault("RAZORPAY_KEY_SECRET", "test_secret")
                db = SessionLocal()
                wallet = db.query(models.Wallet).filter(
                    models.Wallet.user_id == uuid.UUID(passenger["id"])
                ).first()
                if not wallet:
                    wallet = models.Wallet(user_id=uuid.UUID(passenger["id"]), balance=0.0)
                    db.add(wallet)
                    db.commit()
                order_id = f"order_{uuid.uuid4().hex[:10]}"
                txn = models.Transaction(
                    wallet_id=wallet.id,
                    amount=100.0,
                    type="credit",
                    description="Wallet Top Up",
                    status="pending",
                    razorpay_order_id=order_id,
                )
                db.add(txn)
                db.commit()
                db.close()

                spoof = self.req(
                    "POST",
                    "/wallet/verify-payment",
                    token=passenger["token"],
                    json={
                        "razorpay_order_id": order_id,
                        "razorpay_payment_id": "pay_fake",
                        "razorpay_signature": "bad_signature",
                    },
                )
                if spoof.status_code == 400:
                    self.report.pass_("Finance.HMACSpoof", "Invalid HMAC rejected")
                else:
                    self.report.fail("Finance.HMACSpoof", f"Expected 400, got {spoof.status_code}")
            except Exception as exc:
                self.report.fail("Finance.HMACSpoof", str(exc))
        else:
            self.report.skip("Finance.HMACSpoof", "DB unavailable to seed transaction")

        # Core trip for bid/OTP/telemetry tests
        core_trip_id_for_rate_limit: Optional[str] = None
        core_trip = self._create_shared(passenger["token"], total_seats=2)
        if core_trip.status_code == 201:
            core_trip_id = core_trip.json()["id"]
            core_trip_id_for_rate_limit = core_trip_id
            neg_bid = self._place_bid(driver["token"], core_trip_id, -10.0)
            if neg_bid.status_code == 422:
                self.report.pass_("Finance.BidNegative", "Negative bid rejected")
            else:
                self.report.fail("Finance.BidNegative", f"Expected 422, got {neg_bid.status_code}")

            bid_resp = self._place_bid(driver["token"], core_trip_id, 20.0)
            bid_id = bid_resp.json().get("id") if bid_resp.status_code in (200, 201) else None

            # Bid rate limit
            if bid_id:
                accept_resp = self._accept_bid(passenger["token"], bid_id)
                otp = accept_resp.json().get("otp") if accept_resp.status_code == 200 else None
                if not otp:
                    self.report.fail("State.OTPStart", "Failed to get OTP for core trip")
                else:
                    start_resp = self._start_trip(driver["token"], core_trip_id, otp)
                    if start_resp.status_code == 200:
                        self.report.pass_("State.OTPStart", "OTP verification succeeded")
                    else:
                        self.report.fail("State.OTPStart", f"OTP start failed: {start_resp.status_code}")

                    second = self._start_trip(driver["token"], core_trip_id, otp)
                    if second.status_code == 400:
                        self.report.pass_("State.DoubleOTP", "Second OTP verification rejected")
                    else:
                        self.report.fail("State.DoubleOTP", f"Expected 400, got {second.status_code}")

                    last_resp = None
                    for _ in range(61):
                        last_resp = self.req(
                            "POST",
                            f"/rides/{core_trip_id}/location",
                            token=driver["token"],
                            json={"lat": 12.9716, "lng": 77.5946},
                        )
                    if last_resp and last_resp.status_code == 429:
                        self.report.pass_("RateLimit.TelemetryFlood", "Location rate limit enforced")
                    else:
                        self.report.fail("RateLimit.TelemetryFlood", f"Expected 429, got {last_resp.status_code if last_resp else 'n/a'}")
            else:
                self.report.fail("State.OTPStart", "Failed to place bid for core trip")
        else:
            self.report.fail("State.OTPStart", "Failed to create core trip")

        # Self-dealing bid
        self_deal_trip = self._create_shared(driver["token"], total_seats=2)
        if self_deal_trip.status_code == 201:
            trip_id = self_deal_trip.json()["id"]
            self_deal_bid = self._place_bid(driver["token"], trip_id, 30.0)
            if self_deal_bid.status_code == 400:
                self.report.pass_("Logic.SelfDealingBid", "Self-bid blocked")
            else:
                self.report.fail("Logic.SelfDealingBid", f"Expected 400, got {self_deal_bid.status_code}")
        else:
            self.report.fail("Logic.SelfDealingBid", "Failed to create driver-owned trip")

        # Double-acceptance race
        try:
            race_trip = self._create_shared(passenger["token"], total_seats=2)
            if race_trip.status_code != 201:
                raise RuntimeError("Failed to create race trip")
            race_trip_id = race_trip.json()["id"]
            race_bid = self._place_bid(driver["token"], race_trip_id, 21.0)
            bid_id = race_bid.json().get("id") if race_bid.status_code in (200, 201) else None
            if bid_id:
                barrier = threading.Barrier(3)
                results: list[int] = []

                def _runner():
                    barrier.wait()
                    resp = self._accept_bid(passenger["token"], bid_id)
                    results.append(resp.status_code)

                threads = [threading.Thread(target=_runner) for _ in range(2)]
                for t in threads:
                    t.start()
                barrier.wait()
                for t in threads:
                    t.join()

                success = results.count(200)
                if success == 1 and all(code in (400, 409, 200) for code in results):
                    self.report.pass_("Concurrency.DoubleAccept", f"Results: {results}")
                else:
                    self.report.fail("Concurrency.DoubleAccept", f"Unexpected results: {results}")
            else:
                self.report.fail("Concurrency.DoubleAccept", "Failed to place bid for race test")
        except Exception as exc:
            self.report.fail("Concurrency.DoubleAccept", str(exc))

        # Rate limits (register/login/bid)
        # Register
        register_hit = False
        for i in range(6):
            register_resp = self.req(
                "POST",
                "/auth/register",
                json={
                    "email": f"edge_rate_{uuid.uuid4().hex[:6]}@example.com",
                    "password": "Password123!",
                    "full_name": "Edge Rate",
                    "phone": f"96{uuid.uuid4().int % 10_000_000_000:010d}",
                    "role": "passenger",
                },
            )
            if register_resp.status_code == 429:
                register_hit = True
                break
        if register_hit:
            self.report.pass_("RateLimit.Register", "Register rate limit enforced")
        else:
            self.report.fail("RateLimit.Register", f"Expected 429, got {register_resp.status_code}")

        # Login
        login_hit = False
        login_resp = None
        for i in range(11):
            login_resp = self.req("POST", "/auth/login", json={"email": f"nobody{i}@invalid.com", "password": "wrong"})
            if login_resp.status_code == 429:
                login_hit = True
                break
        if login_hit:
            self.report.pass_("RateLimit.Login", "Login rate limit enforced")
        else:
            self.report.fail("RateLimit.Login", f"Expected 429, got {login_resp.status_code if login_resp else 'n/a'}")

        # Bid rate limit (re-use core trip if available)
        bid_limit_trip = core_trip_id_for_rate_limit
        if bid_limit_trip:
            bid_limit_resp = None
            for i in range(6):
                bid_limit_resp = self._place_bid(driver["token"], bid_limit_trip, 40.0 + i)
                if bid_limit_resp.status_code == 429:
                    break
            if bid_limit_resp and bid_limit_resp.status_code == 429:
                self.report.pass_("RateLimit.Bids", "Bid rate limit enforced")
            else:
                self.report.fail("RateLimit.Bids", f"Expected 429, got {bid_limit_resp.status_code if bid_limit_resp else 'n/a'}")
        else:
            self.report.fail("RateLimit.Bids", "Core trip unavailable for bid rate limit test")

        return self.report.summarize()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=os.getenv("COMMUTO_BASE_URL", "http://localhost:8000"))
    parser.add_argument("--timeout", type=float, default=15.0)
    args = parser.parse_args()

    verifier = EdgeCaseVerifier(base_url=args.base_url, timeout=args.timeout)
    raise SystemExit(verifier.run())
