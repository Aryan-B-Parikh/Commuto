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
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    verify_url = f"{frontend_url}/verify-email?token={token}"

    payload = {
        "service_id": service_id,
        "template_id": template_id,
        "user_id": public_key,
        "template_params": {
            "to_email": to_email,
            "email": to_email,
            "verify_url": verify_url,
            "verification_link": verify_url,
            "verification_token": token,
            "token": token,
            "otp": token,
            "code": token,
            "app_name": "Commuto",
        },
    }

    if private_key:
        payload["accessToken"] = private_key
        payload["privateKey"] = private_key
    if public_key:
        payload["publicKey"] = public_key

    headers = {
        "Content-Type": "application/json",
        "Origin": frontend_url,
    }

    try:
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
