"""
emailjs_service - EmailJS delivery for transactional messages.

This service is used as a fallback when SMTP is not configured.
It sends verification emails through EmailJS REST API.
"""
from __future__ import annotations

import logging
import os

import requests

logger = logging.getLogger(__name__)


def emailjs_is_configured() -> bool:
    """Return True when required EmailJS configuration is present."""
    service_id = os.getenv("EMAILJS_SERVICE_ID")
    template_id = os.getenv("EMAILJS_TEMPLATE_ID")
    public_key = os.getenv("EMAILJS_PUBLIC_KEY") or os.getenv("EMAILJS_USER_ID")
    return bool(
        service_id
        and template_id
        and public_key
    )


def send_verification_email_via_emailjs(to_email: str, token: str) -> None:
    """Send verification email via EmailJS.

    Designed to run as a FastAPI background task. Any exception is logged and
    intentionally not re-raised so it does not impact the HTTP response.
    """
    service_id = os.getenv("EMAILJS_SERVICE_ID", "service_wu86z4p")
    template_id = os.getenv("EMAILJS_TEMPLATE_ID", "template_dfq9mib")
    public_key = os.getenv("EMAILJS_PUBLIC_KEY") or os.getenv("EMAILJS_USER_ID")
    private_key = os.getenv("EMAILJS_PRIVATE_KEY") or os.getenv("EMAILJS_ACCESS_TOKEN")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    verify_url = f"{frontend_url}/verify-email?token={token}"

    # EmailJS rejects unknown top-level keys on the REST send endpoint.
    # Keep the request body minimal and use the legacy-compatible field names
    # that the API accepts consistently.
    payload = {
        "service_id": service_id,
        "template_id": template_id,
        "user_id": public_key,
        "template_params": {
            "to_email": to_email,
            "email": to_email,
            "to_name": to_email.split("@", 1)[0],
            "verify_url": verify_url,
            "verification_link": verify_url,
            "verification_url": verify_url,
            "verification_token": token,
            "token": token,
            "otp": token,
            "code": token,
            "passcode": token,
            "one_time_password": token,
            "time": "15 minutes",
            "expiry": "15 minutes",
            "expires_in": "15 minutes",
            "app_name": "Commuto",
            "company_name": "Commuto",
            "product_name": "Commuto",
            "support_email": os.getenv("SMTP_USER", "support@commuto.local"),
            "logo_url": os.getenv("EMAIL_LOGO_URL", ""),
        },
    }

    if private_key:
        payload["accessToken"] = private_key

    headers = {
        "Content-Type": "application/json",
        "Origin": frontend_url,
    }

    try:
        logger.info(
            "Sending EmailJS verification email: service_id=%s template_id=%s to=%s",
            service_id,
            template_id,
            to_email,
        )
        response = requests.post(
            "https://api.emailjs.com/api/v1.0/email/send",
            json=payload,
            headers=headers,
            timeout=10,
        )
        response.raise_for_status()
        logger.info("Verification email dispatched via EmailJS to %s", to_email)
    except requests.HTTPError as exc:
        body = ""
        try:
            body = response.text  # type: ignore[name-defined]
        except Exception:  # noqa: BLE001
            body = "<unavailable>"
        logger.error(
            "EmailJS HTTP error for %s: status=%s body=%s",
            to_email,
            getattr(response, "status_code", "unknown"),  # type: ignore[name-defined]
            body,
        )
        logger.error("EmailJS background send failed for %s: %s", to_email, exc)
    except Exception as exc:  # noqa: BLE001
        logger.error("EmailJS background send failed for %s: %s", to_email, exc)
