"""
emailjs_service - EmailJS delivery for transactional messages.

This service is used as a fallback when SMTP is not configured.
It sends verification emails through EmailJS REST API.
"""
from __future__ import annotations

import logging
import os
from typing import Any

import requests

logger = logging.getLogger(__name__)


def _emailjs_session() -> requests.Session:
    """Create a session that ignores broken machine-level proxy settings."""
    session = requests.Session()
    session.trust_env = False
    return session


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


def get_emailjs_config_status() -> dict[str, bool]:
    """Return a non-secret readiness snapshot for debugging."""
    return {
        "service_id": bool(os.getenv("EMAILJS_SERVICE_ID")),
        "template_id": bool(os.getenv("EMAILJS_TEMPLATE_ID")),
        "public_key": bool(os.getenv("EMAILJS_PUBLIC_KEY") or os.getenv("EMAILJS_USER_ID")),
        "private_key": bool(os.getenv("EMAILJS_PRIVATE_KEY") or os.getenv("EMAILJS_ACCESS_TOKEN")),
    }


def _build_emailjs_payload(
    *,
    to_email: str,
    user_name: str,
    auth_provider: str,
    email_type: str,
    verify_url: str,
    token: str,
    is_new_user: bool,
) -> dict[str, Any]:
    service_id = os.getenv("EMAILJS_SERVICE_ID", "service_wu86z4p")
    template_id = os.getenv("EMAILJS_TEMPLATE_ID", "template_dfq9mib")
    public_key = os.getenv("EMAILJS_PUBLIC_KEY") or os.getenv("EMAILJS_USER_ID")
    private_key = os.getenv("EMAILJS_PRIVATE_KEY") or os.getenv("EMAILJS_ACCESS_TOKEN")

    payload: dict[str, Any] = {
        "service_id": service_id,
        "template_id": template_id,
        "user_id": public_key,
        "template_params": {
            "to_email": to_email,
            "email": to_email,
            "to_name": user_name,
            "user_name": user_name,
            "full_name": user_name,
            "name": user_name,
            "auth_provider": auth_provider,
            "email_type": email_type,
            "is_new_user": "true" if is_new_user else "false",
            "verify_url": verify_url,
            "verification_link": verify_url,
            "verification_url": verify_url,
            "verification_token": token,
            "token": token,
            "otp": token,
            "code": token,
            "passcode": token,
            "one_time_password": token,
            "time": "15 minutes" if token else "",
            "expiry": "15 minutes" if token else "",
            "expires_in": "15 minutes" if token else "",
            "app_name": "Commuto",
            "company_name": "Commuto",
            "product_name": "Commuto",
            "support_email": os.getenv("SMTP_USER", "support@commuto.local"),
            "logo_url": os.getenv("EMAIL_LOGO_URL", ""),
        },
    }

    if private_key:
        payload["accessToken"] = private_key

    return payload


def send_auth_email_via_emailjs(
    to_email: str,
    user_name: str,
    *,
    token: str = "",
    auth_provider: str = "password",
    email_type: str = "verification",
    is_new_user: bool = False,
) -> None:
    """Send an auth-related email via EmailJS.

    Designed to run as a FastAPI background task. Any exception is logged and
    intentionally not re-raised so it does not impact the HTTP response.
    """
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    verify_url = f"{frontend_url}/verify-email?token={token}" if token else frontend_url
    normalized_name = (user_name or to_email.split("@", 1)[0]).strip()
    payload = _build_emailjs_payload(
        to_email=to_email,
        user_name=normalized_name,
        auth_provider=auth_provider,
        email_type=email_type,
        verify_url=verify_url,
        token=token,
        is_new_user=is_new_user,
    )

    service_id = payload["service_id"]
    template_id = payload["template_id"]

    headers = {
        "Content-Type": "application/json",
        "Origin": frontend_url,
    }

    try:
        logger.info(
            "EmailJS config status before send: %s",
            get_emailjs_config_status(),
        )
        logger.info(
            "Sending EmailJS auth email: service_id=%s template_id=%s to=%s provider=%s type=%s new_user=%s",
            service_id,
            template_id,
            to_email,
            auth_provider,
            email_type,
            is_new_user,
        )
        logger.debug(
            "EmailJS template params for %s: keys=%s values={to_email=%s, user_name=%s, auth_provider=%s, email_type=%s, verify_url=%s, token_present=%s}",
            to_email,
            sorted(payload["template_params"].keys()),
            to_email,
            normalized_name,
            auth_provider,
            email_type,
            verify_url,
            bool(token),
        )
        response = _emailjs_session().post(
            "https://api.emailjs.com/api/v1.0/email/send",
            json=payload,
            headers=headers,
            timeout=10,
        )
        response.raise_for_status()
        logger.info("Auth email dispatched via EmailJS to %s", to_email)
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


def send_verification_email_via_emailjs(to_email: str, token: str, user_name: str = "") -> None:
    """Backwards-compatible verification email wrapper."""
    send_auth_email_via_emailjs(
        to_email,
        user_name,
        token=token,
        auth_provider="password",
        email_type="verification",
        is_new_user=True,
    )
