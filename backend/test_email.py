import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv
import requests

load_dotenv(".env")

print("--- TESTING SMTP ---")
smtp_host = os.getenv("SMTP_HOST")
smtp_port = int(os.getenv("SMTP_PORT", "587"))
smtp_user = os.getenv("SMTP_USER")
smtp_pass = os.getenv("SMTP_PASS")

if smtp_host and smtp_user and smtp_pass:
    print(f"Connecting to {smtp_host}:{smtp_port} as {smtp_user}...")
    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            print("SMTP login SUCCESS")
    except Exception as e:
        print(f"SMTP error: {e}")
else:
    print("SMTP not fully configured in .env")

print("\n--- TESTING EMAILJS ---")
service_id = os.getenv("EMAILJS_SERVICE_ID")
template_id = os.getenv("EMAILJS_TEMPLATE_ID")
public_key = os.getenv("EMAILJS_PUBLIC_KEY")

if service_id and template_id and public_key:
    payload = {
        "service_id": service_id,
        "template_id": template_id,
        "user_id": public_key,
        "template_params": {
            "to_email": "test@example.com",
            "to_name": "Test User",
            "token": "123456"
        }
    }
    try:
        resp = requests.post("https://api.emailjs.com/api/v1.0/email/send", json=payload, headers={"Origin": "http://localhost:3000"})
        print(f"EmailJS Response: {resp.status_code}")
        print(resp.text)
    except Exception as e:
        print(f"EmailJS Error: {e}")
else:
    print("EmailJS not fully configured in .env")
