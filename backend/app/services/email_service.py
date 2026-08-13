import json
import smtplib
import ssl
import traceback
import urllib.error
import urllib.request
from email.message import EmailMessage
from email.utils import parseaddr

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
SMTP_PORTS_BLOCKED = (
    "Railway cannot reach smtp.gmail.com (SMTP ports 587/465 blocked). Copy the invite link and share it."
)


def deliver_invite_email(invite_id: int, to_email: str, name: str, role: str, accept_url: str) -> None:
    print(f"Invite email background send starting invite_id={invite_id} to={to_email}", flush=True)
    try:
        ok, message = send_invite_email(to_email, name, role, accept_url)
    except Exception as error:
        _log_exception("Invite email SMTP failed", error)
        ok, message = False, (_smtp_blocked_message() if _is_network_unreachable(error) else SEND_FAILED)
    _store_invite_email_result(invite_id, ok, message)


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
    if settings.smtp_host.strip() and settings.smtp_user.strip():
        return _send_smtp(to_email, subject, text, html)
    if settings.resend_api_key.strip():
        return _send_resend(to_email, subject, text, html)
    print(f"Invite email SMTP failed: {NOT_CONFIGURED}", flush=True)
    return False, NOT_CONFIGURED


def _store_invite_email_result(invite_id: int, ok: bool, message: str) -> None:
    from app.db.session import SessionLocal
    from app.models.invite import WorkspaceInvite

    db = SessionLocal()
    try:
        invite = db.query(WorkspaceInvite).filter(WorkspaceInvite.id == invite_id).first()
        if not invite:
            print(f"Invite email result skipped missing invite_id={invite_id}", flush=True)
            return
        invite.email_error = None if ok else (message or SEND_FAILED)
        db.commit()
        print(f"Invite email result stored invite_id={invite_id} ok={ok}", flush=True)
    except Exception as error:
        db.rollback()
        _log_exception("Invite email result persist failed", error)
    finally:
        db.close()


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
        with urllib.request.urlopen(request, timeout=SMTP_TIMEOUT) as response:
            if response.status >= 300:
                body = response.read()
                print(f"Invite email Resend failed: status={response.status} body={body!r}", flush=True)
                return False, SEND_FAILED
            print(f"Invite email sent via Resend to={to_email}", flush=True)
            return True, ""
    except Exception as error:
        _log_exception("Invite email Resend failed", error)
        if isinstance(error, (urllib.error.URLError, TimeoutError)):
            return False, UNREACHABLE
        return False, SEND_FAILED


def _smtp_credentials() -> tuple[str, str, str, str]:
    host = settings.smtp_host.strip()
    user = settings.smtp_user.strip()
    password = "".join((settings.smtp_password or "").split())
    sender = _smtp_from_address(user, (settings.smtp_from or "").strip())
    return host, user, password, sender


def _smtp_from_address(user: str, configured_from: str) -> str:
    sender = configured_from or user
    _, email = parseaddr(sender)
    address = (email or sender).strip()
    if "gmail.com" in settings.smtp_host.lower() and address.lower() != user.lower():
        print(
            f"Invite email SMTP From {address!r} does not match SMTP_USER; using {user}",
            flush=True,
        )
        return user
    return sender or user


def _smtp_attempts(host: str) -> list[tuple[str, str, int]]:
    port = settings.smtp_port or 587
    if port == 465:
        return [("ssl", host, 465), ("starttls", host, 587)]
    starttls_port = port if port != 465 else 587
    attempts = [("starttls", host, starttls_port)]
    if starttls_port != 465:
        attempts.append(("ssl", host, 465))
    return attempts


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
    print(
        f"Invite email SMTP sending host={host!r} user={user!r} from={sender!r} "
        f"password_len={len(password)} to={to_email!r}",
        flush=True,
    )

    for mode, attempt_host, port in _smtp_attempts(host):
        try:
            print(f"Invite email SMTP trying {mode} {attempt_host}:{port}", flush=True)
            if mode == "ssl":
                with smtplib.SMTP_SSL(attempt_host, port, timeout=SMTP_TIMEOUT, context=context) as smtp:
                    smtp.login(user, password)
                    smtp.send_message(message)
            else:
                with smtplib.SMTP(attempt_host, port, timeout=SMTP_TIMEOUT) as smtp:
                    smtp.ehlo()
                    smtp.starttls(context=context)
                    smtp.ehlo()
                    smtp.login(user, password)
                    smtp.send_message(message)
            print(f"Invite email sent via SMTP {mode} {attempt_host}:{port} to={to_email}", flush=True)
            return True, ""
        except Exception as error:
            last_error = error
            _log_smtp_error(error, attempt_host, port, mode)
            if _is_network_unreachable(error):
                print(
                    f"Railway cannot reach {attempt_host} (SMTP ports blocked).",
                    flush=True,
                )
                return False, _smtp_blocked_message(attempt_host)

    if isinstance(last_error, smtplib.SMTPAuthenticationError):
        return False, AUTH_FAILED
    if isinstance(last_error, (TimeoutError, ConnectionRefusedError, smtplib.SMTPServerDisconnected)):
        return False, UNREACHABLE
    if isinstance(last_error, OSError) and not isinstance(last_error, smtplib.SMTPException):
        return False, UNREACHABLE
    return False, SEND_FAILED


def _smtp_blocked_message(host: str = "") -> str:
    target = (host or settings.smtp_host or "smtp.gmail.com").strip() or "smtp.gmail.com"
    if target.lower() == "smtp.gmail.com":
        return SMTP_PORTS_BLOCKED
    return (
        f"Railway cannot reach {target} (SMTP ports 587/465 blocked). "
        "Copy the invite link and share it."
    )


def _is_network_unreachable(error: BaseException | None) -> bool:
    current: BaseException | None = error
    seen: set[int] = set()
    while current is not None and id(current) not in seen:
        seen.add(id(current))
        if getattr(current, "errno", None) == 101:
            return True
        text = str(current).lower()
        if "network is unreachable" in text or "[errno 101]" in text:
            return True
        reason = getattr(current, "reason", None)
        if isinstance(reason, BaseException):
            current = reason
            continue
        current = current.__cause__ or current.__context__
    return False


def _log_smtp_error(error: BaseException, host: str, port: int, mode: str) -> None:
    smtp_code = getattr(error, "smtp_code", None)
    smtp_error = getattr(error, "smtp_error", None)
    print(
        f"Invite email SMTP failed mode={mode} host={host} port={port} "
        f"type={type(error).__name__} smtp_code={smtp_code} smtp_error={smtp_error!r} error={error!r}",
        flush=True,
    )
    traceback.print_exc()


def _log_exception(prefix: str, error: BaseException) -> None:
    print(f"{prefix}: {type(error).__name__}: {error!r}", flush=True)
    traceback.print_exc()
