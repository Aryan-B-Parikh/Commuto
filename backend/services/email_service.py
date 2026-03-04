"""
email_service – SMTP email delivery for transactional messages.

Extracted from auth_router.py so that email template logic and SMTP
configuration can evolve independently from the HTTP layer.

Usage
-----
Call ``smtp_is_configured()`` synchronously to decide the response path,
then schedule ``send_verification_email`` as a FastAPI BackgroundTask so
the SMTP handshake never blocks the event loop::

    from fastapi import BackgroundTasks
    from services.email_service import smtp_is_configured, send_verification_email

    if smtp_is_configured():
        background_tasks.add_task(send_verification_email, email, token)
"""
from __future__ import annotations

import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)


def smtp_is_configured() -> bool:
    """Return True only when all required SMTP environment variables are present."""
    return bool(
        os.getenv("SMTP_HOST")
        and os.getenv("SMTP_USER")
        and os.getenv("SMTP_PASS")
    )


def send_verification_email(to_email: str, token: str) -> None:
    """Build and dispatch an email verification message via SMTP.

    Designed to run as a **background task** (fire-and-forget).  Any SMTP
    exception is caught and logged; errors are never propagated back to the
    HTTP response because the response has already been sent by the time
    this function executes.

    Credentials are read from environment variables at call time so that
    secret rotation does not require a server restart.
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    verify_url = f"{frontend_url}/verify-email?token={token}"

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Verify your Commuto account"
        msg["From"] = smtp_user
        msg["To"] = to_email
        html = f"""
        <html><body>
          <h2>Welcome to Commuto!</h2>
          <p>Click the link below to verify your email address:</p>
          <a href="{verify_url}" style="background:#4F46E5;color:#fff;padding:12px 24px;
             border-radius:8px;text-decoration:none;display:inline-block;">
            Verify Email
          </a>
          <p>Or copy this link: {verify_url}</p>
          <p>This link expires in 24 hours.</p>
        </body></html>
        """
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, to_email, msg.as_string())
        logger.info("Verification email delivered to %s", to_email)
    except Exception as exc:  # noqa: BLE001
        logger.error("SMTP background send failed for %s: %s", to_email, exc)
