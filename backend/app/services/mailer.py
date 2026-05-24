from __future__ import annotations

import smtplib
from email.message import EmailMessage

from app.core.config import settings


def smtp_configured() -> bool:
    return bool(settings.smtp_host and settings.mail_from)


def send_password_reset_otp_email(*, to_email: str, otp_code: str, display_name: str | None = None) -> None:
    if not smtp_configured():
        raise RuntimeError("SMTP is not configured.")

    subject = "Your FairSplit verification code"
    greeting_name = (display_name or "").strip() or "there"
    text_body = (
        f"Hi {greeting_name},\n\n"
        f"We received a request to reset your FairSplit password.\n\n"
        f"Your 6-digit verification code is: {otp_code}\n\n"
        "This code expires in 30 minutes.\n"
        "If you did not request a password reset, you can ignore this email.\n"
    )
    html_body = f"""
    <html>
      <body style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <p>Hi {greeting_name},</p>
        <p>We received a request to reset your FairSplit password.</p>
        <p style="font-size:16px;font-weight:700;letter-spacing:0.18em;background:#ecfeff;border:1px solid #99f6e4;padding:14px 18px;border-radius:16px;display:inline-block">
          {otp_code}
        </p>
        <p>This code expires in 30 minutes.</p>
        <p>If you did not request a password reset, you can ignore this email.</p>
      </body>
    </html>
    """

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"{settings.mail_from_name} <{settings.mail_from}>"
    message["To"] = to_email
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")

    if settings.smtp_use_ssl:
        with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=20) as client:
            if settings.smtp_username and settings.smtp_password:
                client.login(settings.smtp_username, settings.smtp_password)
            client.send_message(message)
        return

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as client:
        if settings.smtp_use_tls:
            client.starttls()
        if settings.smtp_username and settings.smtp_password:
            client.login(settings.smtp_username, settings.smtp_password)
        client.send_message(message)
