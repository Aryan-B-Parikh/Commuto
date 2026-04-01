import argparse
import sys
import time
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any

import requests


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Reusable direct terminal E2E flow for Commuto ride lifecycle"
    )
    parser.add_argument("--base-url", default="http://127.0.0.1:8000", help="Backend API base URL")
    parser.add_argument("--timeout", type=float, default=20.0, help="HTTP timeout seconds")
    parser.add_argument(
        "--auth-delay",
        type=float,
        default=1.2,
        help="Delay between register/login calls to avoid rate-limit bursts",
    )
    parser.add_argument("--bid-amount", type=float, default=140.0, help="Driver bid amount")
    parser.add_argument("--price-per-seat", type=float, default=130.0, help="Shared ride price per seat")
    return parser.parse_args()


def request(base_url: str, timeout: float, method: str, path: str, **kwargs) -> requests.Response:
    return requests.request(method, f"{base_url}{path}", timeout=timeout, **kwargs)


def must_ok(response: requests.Response, label: str, expected_codes=(200, 201)) -> Dict[str, Any]:
    if response.status_code not in expected_codes:
        raise RuntimeError(f"{label} failed [{response.status_code}] {response.text}")
    try:
        return response.json()
    except ValueError:
        return {}


def register_and_login(
    base_url: str,
    timeout: float,
    auth_delay: float,
    role: str,
    full_name: str,
    phone: str,
) -> Dict[str, str]:
    email = f"{role}_{uuid.uuid4().hex[:8]}@example.com"
    payload: Dict[str, Any] = {
        "email": email,
        "password": "Password123!",
        "full_name": full_name,
        "phone": phone,
        "role": role,
    }

    if role == "driver":
        payload.update(
            {
                "license_number": f"DL{uuid.uuid4().hex[:6]}",
                "vehicle_make": "Hyundai",
                "vehicle_model": "i20",
                "vehicle_plate": f"MH03{uuid.uuid4().hex[:4].upper()}",
                "vehicle_capacity": 4,
            }
        )

    must_ok(
        request(base_url, timeout, "POST", "/auth/register", json=payload),
        f"register {role}",
        expected_codes=(200, 201),
    )
    time.sleep(auth_delay)

    login_data = must_ok(
        request(
            base_url,
            timeout,
            "POST",
            "/auth/login",
            json={"email": email, "password": "Password123!"},
        ),
        f"login {role}",
    )
    token = login_data.get("access_token")
    if not token:
        raise RuntimeError(f"login {role} failed: missing access_token")

    return {"email": email, "auth": f"Bearer {token}"}


def verify_full_flow() -> int:
    args = parse_args()
    base_url = args.base_url.rstrip("/")

    print("=== Commuto Reusable Direct Flow Check ===")
    print(f"Base URL: {base_url}")

    try:
        creator = register_and_login(
            base_url, args.timeout, args.auth_delay, "passenger", "E2E Creator", "9510000001"
        )
        joiner = register_and_login(
            base_url, args.timeout, args.auth_delay, "passenger", "E2E Joiner", "9510000002"
        )
        driver = register_and_login(
            base_url, args.timeout, args.auth_delay, "driver", "E2E Driver", "9510000003"
        )

        creator_headers = {"Authorization": creator["auth"]}
        joiner_headers = {"Authorization": joiner["auth"]}
        driver_headers = {"Authorization": driver["auth"]}

        trip_date = datetime.utcnow() + timedelta(days=1)
        create_payload = {
            "from_location": {"address": "E2E A", "lat": 12.9716, "lng": 77.5946},
            "to_location": {"address": "E2E B", "lat": 12.9352, "lng": 77.6245},
            "date": trip_date.strftime("%Y-%m-%d"),
            "time": trip_date.strftime("%H:%M"),
            "total_seats": 3,
            "price_per_seat": args.price_per_seat,
        }

        trip = must_ok(
            request(
                base_url,
                args.timeout,
                "POST",
                "/rides/create-shared",
                headers=creator_headers,
                json=create_payload,
            ),
            "create shared ride",
        )
        trip_id = trip.get("id")
        if not trip_id:
            raise RuntimeError("create shared ride failed: missing trip id")
        print(f"PASS create-shared: {trip_id}")

        must_ok(
            request(
                base_url,
                args.timeout,
                "POST",
                f"/rides/{trip_id}/join",
                headers=joiner_headers,
                json={"notes": "joining via direct-flow script"},
            ),
            "join ride",
        )
        print("PASS join")

        bid = must_ok(
            request(
                base_url,
                args.timeout,
                "POST",
                f"/bids/{trip_id}",
                headers=driver_headers,
                json={"amount": args.bid_amount, "message": "ready for pickup"},
            ),
            "place bid",
        )
        bid_id = bid.get("id")
        if not bid_id:
            raise RuntimeError("place bid failed: missing bid id")
        print(f"PASS bid: {bid_id}")

        accepted = must_ok(
            request(
                base_url,
                args.timeout,
                "POST",
                f"/bids/{bid_id}/accept",
                headers=creator_headers,
            ),
            "accept bid",
        )
        otp = accepted.get("otp")
        if not otp:
            raise RuntimeError("accept bid failed: missing otp")
        print("PASS accept-bid")

        started = must_ok(
            request(
                base_url,
                args.timeout,
                "POST",
                f"/rides/{trip_id}/verify-otp",
                headers=driver_headers,
                json={"otp": otp},
            ),
            "verify otp",
        )
        completion_otp = started.get("completion_otp")
        if not completion_otp:
            raise RuntimeError("verify otp failed: missing completion_otp")
        print("PASS verify-otp")

        must_ok(
            request(
                base_url,
                args.timeout,
                "POST",
                f"/rides/{trip_id}/complete",
                headers=driver_headers,
                json={"otp": completion_otp},
            ),
            "complete ride",
        )
        print("PASS complete-ride")

        creator_details = must_ok(
            request(
                base_url,
                args.timeout,
                "GET",
                f"/rides/{trip_id}/details",
                headers=creator_headers,
            ),
            "creator ride details",
        )
        joiner_details = must_ok(
            request(
                base_url,
                args.timeout,
                "GET",
                f"/rides/{trip_id}/details",
                headers=joiner_headers,
            ),
            "joiner ride details",
        )

        creator_payment = creator_details.get("user_booking", {}).get("payment_status")
        joiner_payment = joiner_details.get("user_booking", {}).get("payment_status")
        if creator_payment != "completed" or joiner_payment != "completed":
            raise RuntimeError(
                "payment status mismatch after complete: "
                f"creator={creator_payment}, joiner={joiner_payment}"
            )

        print("PASS payment-status: completed for both passengers")
        print("=== FLOW RESULT: PASS ===")
        return 0

    except Exception as exc:
        print(f"=== FLOW RESULT: FAIL ===\n{exc}")
        return 1


if __name__ == "__main__":
    sys.exit(verify_full_flow())
