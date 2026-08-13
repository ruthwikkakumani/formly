import json
import smtplib
import ssl
import threading
import urllib.error
import urllib.request
from email.message import EmailMessage

from app.core.config import settings

AUTH_FAILED = (
    "Email login was rejected. If you use Gmail, use an app password and send from the same address you signed in with."
)
SEND_FAILED = "We couldn't send the invite email. Check the email settings and try again."
UNREACHABLE = "We couldn't reach the email provider. Please try again in a moment."
NOT_CONFIGURED = (
    "Invite emails aren't set up yet. Ask the workspace owner to configure email, then try again."
)
SMTP_TIMEOUT = 20


def queue_invite_email(to_email: str, name: str, role: str, accept_url: str) -> None:
    thread = threading.Thread(
        target=_send_invite_email_safe,
        args=(to_email, name, role, accept_url),
        daemon=True,
        name="formly-invite-email",
    )
    thread.start()


def send_invite_email(to_email: str, name: str, role: str, accept_url: str) -> tuple[bool, str]:
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
        return _send_resend(to_email, subject, text, html)
    if settings.smtp_host.strip() and settings.smtp_user.strip():
        return _send_smtp(to_email, subject, text, html)
    print(f"Invite email SMTP failed: {RuntimeError(NOT_CONFIGURED)!r}", flush=True)
    return False, NOT_CONFIGURED


def _send_invite_email_safe(to_email: str, name: str, role: str, accept_url: str) -> None:
    try:
        send_invite_email(to_email, name, role, accept_url)
    except Exception as error:
        print(f"Invite email SMTP failed: {error!r}", flush=True)


def _send_resend(to_email: str, subject: str, text: str, html: str) -> tuple[bool, str]:
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
        with urllib.request.urlopen(request, timeout=5) as response:
            if response.status >= 300:
                body = response.read()
                print(f"Invite email SMTP failed: {RuntimeError(f'status={response.status} body={body!r}')!r}", flush=True)
                return False, SEND_FAILED
            print("Invite email sent", flush=True)
            return True, ""
    except Exception as error:
        print(f"Invite email SMTP failed: {error!r}", flush=True)
        if isinstance(error, (urllib.error.URLError, TimeoutError)):
            return False, UNREACHABLE
        return False, SEND_FAILED


def _smtp_credentials() -> tuple[str, str, str, str]:
    host = settings.smtp_host.strip()
    user = settings.smtp_user.strip()
    password = "".join((settings.smtp_password or "").split())
    sender = (settings.smtp_from or settings.smtp_user).strip()
    return host, user, password, sender


def _send_smtp(to_email: str, subject: str, text: str, html: str) -> tuple[bool, str]:
    host, user, password, sender = _smtp_credentials()
    message = EmailMessage()
    message["From"] = sender
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(text)
    message.add_alternative(html, subtype="html")
    context = ssl.create_default_context()
    last_error: BaseException | None = None

    try:
        with smtplib.SMTP(host, 587, timeout=SMTP_TIMEOUT) as smtp:
            smtp.ehlo()
            smtp.starttls(context=context)
            smtp.ehlo()
            smtp.login(user, password)
            smtp.send_message(message)
        print("Invite email sent", flush=True)
        return True, ""
    except Exception as error:
        last_error = error
        print(f"Invite email SMTP failed: {error!r}", flush=True)

    try:
        with smtplib.SMTP_SSL(host, 465, timeout=SMTP_TIMEOUT, context=context) as smtp:
            smtp.login(user, password)
            smtp.send_message(message)
        print("Invite email sent", flush=True)
        return True, ""
    except Exception as error:
        last_error = error
        print(f"Invite email SMTP failed: {error!r}", flush=True)

    if isinstance(last_error, smtplib.SMTPAuthenticationError):
        return False, AUTH_FAILED
    if isinstance(last_error, (TimeoutError, ConnectionRefusedError, OSError)):
        return False, UNREACHABLE
    return False, SEND_FAILED
