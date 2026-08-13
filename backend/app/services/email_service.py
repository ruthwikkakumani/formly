import json
import smtplib
import ssl
import urllib.error
import urllib.request
from email.message import EmailMessage

from fastapi import HTTPException

from app.core.config import settings


def send_invite_email(to_email: str, name: str, role: str, accept_url: str) -> None:
    subject = "You're invited to the Formly workspace"
    text = (
        f"Hi {name},\n\n"
        f"You were invited to join Formly as {role}.\n"
        f"Open this link to accept. You will not be added until you accept:\n\n"
        f"{accept_url}\n\n"
        "This link expires in 7 days. If you ignore it, nothing changes.\n"
    )
    html = f"""
    <div style="font-family:DM Sans,Arial,sans-serif;max-width:520px;line-height:1.5;color:#191919">
      <p>Hi {name},</p>
      <p>You were invited to join the <b>Formly</b> workspace as <b>{role}</b>.</p>
      <p>You are not a member yet. Click accept to join, or ignore this email to decline.</p>
      <p><a href="{accept_url}" style="display:inline-block;background:#191919;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600">Accept invite</a></p>
      <p style="color:#6f6f6c;font-size:13px">Or paste: {accept_url}</p>
    </div>
    """
    if settings.resend_api_key.strip():
        _send_resend(to_email, subject, text, html)
        return
    if settings.smtp_host.strip() and settings.smtp_user.strip():
        _send_smtp(to_email, subject, text, html)
        return
    raise HTTPException(
        status_code=503,
        detail="Invite emails aren't set up yet. Ask the workspace owner to configure email, then try again.",
    )


def _send_resend(to_email: str, subject: str, text: str, html: str) -> None:
    payload = json.dumps(
        {
            "from": settings.invite_from_email,
            "to": [to_email],
            "subject": subject,
            "text": text,
            "html": html,
        }
    ).encode()
    request = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {settings.resend_api_key.strip()}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            if response.status >= 300:
                raise HTTPException(status_code=502, detail="We couldn't send the invite email. Please try again.")
    except urllib.error.HTTPError as error:
        error.read()
        raise HTTPException(status_code=502, detail="We couldn't send the invite email. Please try again.") from error
    except urllib.error.URLError as error:
        raise HTTPException(
            status_code=502,
            detail="We couldn't reach the email provider. Please try again in a moment.",
        ) from error


def _send_smtp(to_email: str, subject: str, text: str, html: str) -> None:
    message = EmailMessage()
    sender = (settings.smtp_from or settings.smtp_user).strip()
    message["From"] = sender
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(text)
    message.add_alternative(html, subtype="html")
    context = ssl.create_default_context()
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=12) as smtp:
            smtp.starttls(context=context)
            smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(message)
    except smtplib.SMTPAuthenticationError as error:
        raise HTTPException(
            status_code=502,
            detail="Email login was rejected. If you use Gmail, use an app password and send from the same address you signed in with.",
        ) from error
    except (TimeoutError, smtplib.SMTPException, OSError) as error:
        raise HTTPException(
            status_code=502,
            detail="We couldn't send the invite email. Check the email settings and try again.",
        ) from error
