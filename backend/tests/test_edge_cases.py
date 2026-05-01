import os
import uuid
from datetime import datetime, timedelta

import models


def _future_date(days: int = 1) -> str:
    override = os.getenv("COMMUTO_TEST_NOW")
    if override:
        try:
            base = datetime.fromisoformat(override.replace("Z", "+00:00")).replace(tzinfo=None)
            return (base + timedelta(days=days)).strftime("%Y-%m-%d")
        except ValueError:
            pass
    return (datetime.utcnow() + timedelta(days=days)).strftime("%Y-%m-%d")


def _create_shared_trip(client, headers, *, total_seats=2, notes=None, date=None, time="14:00"):
    payload = {
        "from_location": {"address": "123 Start St", "lat": 40.7128, "lng": -74.0060},
        "to_location": {"address": "456 End Ave", "lat": 40.7589, "lng": -73.9851},
        "date": date or _future_date(),
        "time": time,
        "total_seats": total_seats,
        "total_price": 200.0,
    }
    if notes is not None:
        payload["notes"] = notes
    return client.post("/rides/create-shared", json=payload, headers=headers)


def _set_wallet_balance(db, user_id, amount):
    if isinstance(user_id, str):
        user_id = uuid.UUID(user_id)
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == user_id).first()
    if not wallet:
        wallet = models.Wallet(user_id=user_id, balance=amount)
        db.add(wallet)
    else:
        wallet.balance = amount
    db.commit()


class TestInputValidationEdgeCases:
    def test_register_invalid_email_rejected(self, client):
        response = client.post(
            "/auth/register",
            json={
                "email": "not-an-email",
                "password": "testpassword123",
                "full_name": "Bad Email",
                "phone": "+919876543218",
                "role": "passenger",
            },
        )

        assert response.status_code == 422

    def test_shared_trip_seat_bounds(self, client, auth_headers_passenger, db, test_passenger):
        _set_wallet_balance(db, test_passenger["id"], 1000.0)
        assert _create_shared_trip(client, auth_headers_passenger, total_seats=0).status_code == 422
        assert _create_shared_trip(client, auth_headers_passenger, total_seats=1).status_code == 201
        assert _create_shared_trip(client, auth_headers_passenger, total_seats=4).status_code == 201
        assert _create_shared_trip(client, auth_headers_passenger, total_seats=5).status_code == 422

    def test_shared_trip_notes_length_validation(self, client, auth_headers_passenger, db, test_passenger):
        _set_wallet_balance(db, test_passenger["id"], 1000.0)
        valid_notes = "a" * 500
        invalid_notes = "b" * 501

        assert _create_shared_trip(client, auth_headers_passenger, notes=valid_notes).status_code == 201
        assert _create_shared_trip(client, auth_headers_passenger, notes=invalid_notes).status_code == 422

    def test_bid_message_length_validation(self, client, auth_headers_passenger, auth_headers_driver, db, test_passenger):
        _set_wallet_balance(db, test_passenger["id"], 1000.0)
        trip_resp = _create_shared_trip(client, auth_headers_passenger)
        trip_id = trip_resp.json()["id"]

        invalid_message = "m" * 501
        response = client.post(
            f"/bids/{trip_id}",
            json={"amount": 25.0, "message": invalid_message},
            headers=auth_headers_driver,
        )

        assert response.status_code == 422

    def test_shared_trip_time_boundary(self, client, auth_headers_passenger, db, test_passenger, monkeypatch):
        _set_wallet_balance(db, test_passenger["id"], 1000.0)
        monkeypatch.setenv("COMMUTO_TEST_NOW", "2030-01-01T10:00:00")

        ok = _create_shared_trip(
            client,
            auth_headers_passenger,
            date="2030-01-01",
            time="10:00",
        )
        assert ok.status_code == 201

        past = _create_shared_trip(
            client,
            auth_headers_passenger,
            date="2030-01-01",
            time="09:59",
        )
        assert past.status_code == 400
        assert "future" in past.json()["detail"].lower()


class TestFinancialEdgeCases:
    def test_wallet_add_money_non_positive_rejected(self, client, auth_headers_passenger):
        for amount in (0, -50):
            response = client.post(
                "/wallet/add-money",
                json={"amount": amount},
                headers=auth_headers_passenger,
            )
            assert response.status_code == 422

    def test_bid_amount_non_positive_rejected(self, client, auth_headers_passenger, auth_headers_driver, db, test_passenger):
        _set_wallet_balance(db, test_passenger["id"], 1000.0)
        trip_resp = _create_shared_trip(client, auth_headers_passenger)
        trip_id = trip_resp.json()["id"]

        for amount in (0, -10):
            response = client.post(
                f"/bids/{trip_id}",
                json={"amount": amount},
                headers=auth_headers_driver,
            )
            assert response.status_code == 422

    def test_insufficient_funds_block_create_shared(self, client, auth_headers_passenger, db, test_passenger):
        user_id = test_passenger["id"]
        _set_wallet_balance(db, user_id, 0)

        response = _create_shared_trip(client, auth_headers_passenger)
        assert response.status_code == 400
        assert "add money" in response.json()["detail"].lower()

    def test_hmac_spoof_rejected(self, client, auth_headers_passenger, db, test_passenger, monkeypatch):
        monkeypatch.setenv("RAZORPAY_KEY_SECRET", "test_secret")

        user_id = uuid.UUID(test_passenger["id"])
        wallet = db.query(models.Wallet).filter(models.Wallet.user_id == user_id).first()
        if not wallet:
            wallet = models.Wallet(user_id=user_id, balance=0.0)
            db.add(wallet)
            db.commit()

        order_id = f"order_{uuid.uuid4().hex[:10]}"
        transaction = models.Transaction(
            wallet_id=wallet.id,
            amount=100.0,
            type="credit",
            description="Wallet Top Up",
            status="pending",
            razorpay_order_id=order_id,
        )
        db.add(transaction)
        db.commit()

        response = client.post(
            "/wallet/verify-payment",
            json={
                "razorpay_order_id": order_id,
                "razorpay_payment_id": "pay_fake",
                "razorpay_signature": "bad_signature",
            },
            headers=auth_headers_passenger,
        )

        assert response.status_code == 400
        assert "signature" in response.json()["detail"].lower()


class TestConcurrencyAndRateLimits:
    def test_self_dealing_driver_bid_blocked(self, client, auth_headers_driver, db, test_driver):
        driver_id = test_driver["id"]
        _set_wallet_balance(db, driver_id, 1000.0)

        trip_resp = _create_shared_trip(client, auth_headers_driver)
        trip_id = trip_resp.json()["id"]

        response = client.post(
            f"/bids/{trip_id}",
            json={"amount": 25.0},
            headers=auth_headers_driver,
        )

        assert response.status_code == 400
        assert "own trip" in response.json()["detail"].lower()

    def test_register_rate_limit(self, client):
        for i in range(7):
            response = client.post(
                "/auth/register",
                json={
                    "email": f"rate_limit_{i}@test.com",
                    "password": "testpassword123",
                    "full_name": "Rate Limit",
                    "phone": f"98{i:08d}",
                    "role": "passenger",
                },
            )

        assert response.status_code == 429

    def test_location_update_rate_limit(self, client, auth_headers_passenger, auth_headers_driver, db, test_passenger):
        _set_wallet_balance(db, test_passenger["id"], 1000.0)
        trip_resp = _create_shared_trip(client, auth_headers_passenger)
        trip_id = trip_resp.json()["id"]

        bid_resp = client.post(
            f"/bids/{trip_id}",
            json={"amount": 20.0},
            headers=auth_headers_driver,
        )
        bid_id = bid_resp.json()["id"]

        accept_resp = client.post(f"/bids/{bid_id}/accept", headers=auth_headers_passenger)
        otp = accept_resp.json()["otp"]

        start_resp = client.post(
            f"/rides/{trip_id}/verify-otp",
            json={"otp": otp},
            headers=auth_headers_driver,
        )
        assert start_resp.status_code == 200

        response = None
        for _ in range(61):
            response = client.post(
                f"/rides/{trip_id}/location",
                json={"lat": 12.9716, "lng": 77.5946},
                headers=auth_headers_driver,
            )

        assert response is not None
        assert response.status_code == 429

    def test_double_otp_verification_rejected(self, client, auth_headers_passenger, auth_headers_driver, db, test_passenger):
        _set_wallet_balance(db, test_passenger["id"], 1000.0)
        trip_resp = _create_shared_trip(client, auth_headers_passenger)
        trip_id = trip_resp.json()["id"]

        bid_resp = client.post(
            f"/bids/{trip_id}",
            json={"amount": 22.0},
            headers=auth_headers_driver,
        )
        bid_id = bid_resp.json()["id"]

        accept_resp = client.post(f"/bids/{bid_id}/accept", headers=auth_headers_passenger)
        otp = accept_resp.json()["otp"]

        first = client.post(
            f"/rides/{trip_id}/verify-otp",
            json={"otp": otp},
            headers=auth_headers_driver,
        )
        assert first.status_code == 200

        second = client.post(
            f"/rides/{trip_id}/verify-otp",
            json={"otp": otp},
            headers=auth_headers_driver,
        )
        assert second.status_code == 400
        assert "already verified" in second.json()["detail"].lower()
