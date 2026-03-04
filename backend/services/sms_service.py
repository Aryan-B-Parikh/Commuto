"""
sms_service – Twilio SMS delivery for phone OTP verification.

Mirrors the structure of email_service.py so both verification channels
behave consistently.

Usage
-----
    from services.sms_service import twilio_is_configured, send_phone_otp

    if twilio_is_configured():
        background_tasks.add_task(send_phone_otp, phone_number, otp_code)
    else:
        # APP_ENV=development: return OTP in API response
"""
from __future__ import annotations

import logging
import os

logger = logging.getLogger(__name__)


def twilio_is_configured() -> bool:
    """Return True only when all required Twilio environment variables are present."""
    return bool(
        os.getenv("TWILIO_ACCOUNT_SID")
        and os.getenv("TWILIO_AUTH_TOKEN")
        and os.getenv("TWILIO_PHONE_NUMBER")
    )


def send_phone_otp(to_phone: str, otp: str) -> None:
    """Send a 6-digit OTP via Twilio SMS.

    Designed to run as a **background task** (fire-and-forget).
    Any Twilio exception is caught and logged; the HTTP response
    has already been sent by the time this executes.

    Credentials are read from environment variables at call time.
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_PHONE_NUMBER")
    app_name = os.getenv("APP_NAME", "Commuto")

    try:
        from twilio.rest import Client  # type: ignore[import]

        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=f"Your {app_name} verification code is: {otp}\nDo not share this with anyone. Expires in 10 minutes.",
            from_=from_number,
            to=to_phone,
        )
        logger.info("OTP SMS delivered to %s (SID: %s)", to_phone, message.sid)
    except ImportError:
        logger.error(
            "twilio package not installed. Run: pip install twilio"
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Twilio SMS send failed for %s: %s", to_phone, exc)
