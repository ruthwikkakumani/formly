from datetime import datetime
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models import Member
from app.models.invite import WorkspaceInvite, _invite_expiry
from app.schemas.member import EMAIL_PATTERN, MemberPayload
from app.services.auth_service import AuthService
from app.services.email_service import send_invite_email


class InviteService:
    def serialize(self, invite: WorkspaceInvite) -> dict:
        return {
            "id": invite.id,
            "email": invite.email,
            "name": invite.name,
            "role": invite.role,
            "status": invite.status,
            "created_at": invite.created_at,
            "expires_at": invite.expires_at,
            "accept_url": f"{settings.frontend_url.rstrip('/')}/invite/{invite.token}",
        }

    def list_pending(self, db: Session) -> list[dict]:
        self._expire_stale(db)
        invites = (
            db.query(WorkspaceInvite)
            .filter(WorkspaceInvite.status == "pending")
            .order_by(WorkspaceInvite.created_at.desc())
            .all()
        )
        return [self.serialize(invite) for invite in invites]

    def create(self, db: Session, payload: MemberPayload) -> dict:
        self._expire_stale(db)
        email = str(payload.email).strip().lower()
        if not payload.name.strip():
            raise HTTPException(status_code=422, detail="Enter a name.")
        if not EMAIL_PATTERN.match(email):
            raise HTTPException(status_code=422, detail="Enter a valid email address.")
        role = payload.role if payload.role in {"editor", "viewer"} else "editor"
        if db.query(Member).filter(Member.email == email).first():
            raise HTTPException(status_code=409, detail="That person is already in this workspace.")
        invite = (
            db.query(WorkspaceInvite)
            .filter(WorkspaceInvite.email == email, WorkspaceInvite.status == "pending")
            .first()
        )
        if invite:
            invite.name = payload.name.strip()
            invite.role = role
            invite.token = uuid4().hex
            invite.expires_at = _invite_expiry()
        else:
            invite = WorkspaceInvite(name=payload.name.strip(), email=email, role=role)
            db.add(invite)
        db.flush()
        accept_url = f"{settings.frontend_url.rstrip('/')}/invite/{invite.token}"
        try:
            db.commit()
            db.refresh(invite)
        except Exception as error:
            db.rollback()
            print(f"Workspace invite persist failed: {error!r}", flush=True)
            raise HTTPException(
                status_code=502,
                detail="We couldn't create that invite. Please try again.",
            ) from error

        sent, email_error = send_invite_email(email, invite.name, invite.role, accept_url)
        if sent:
            message = "Invite email sent. They join only after accepting the link."
        elif email_error:
            message = f"{email_error.rstrip('.')} Copy the invite link and share it."
        else:
            message = "Invite created, but the email could not be sent. Copy the invite link and share it."
        return {
            "invite": self.serialize(invite),
            "email_sent": sent,
            "accept_url": accept_url,
            "message": message,
        }

    def preview(self, db: Session, token: str) -> dict:
        invite = self._require_open(db, token)
        return {
            "name": invite.name,
            "email": invite.email,
            "role": invite.role,
            "expires_at": invite.expires_at,
        }

    def accept(self, db: Session, token: str, password: str) -> dict:
        invite = self._require_open(db, token)
        if db.query(Member).filter(Member.email == invite.email).first():
            raise HTTPException(status_code=409, detail="That email already has an account. Sign in instead.")
        member = Member(
            name=invite.name,
            email=invite.email,
            role=invite.role,
            password_hash=hash_password(password),
        )
        db.add(member)
        invite.status = "accepted"
        invite.accepted_at = datetime.utcnow()
        db.commit()
        db.refresh(member)
        return AuthService().session(member)

    def revoke(self, db: Session, invite_id: int) -> None:
        invite = db.query(WorkspaceInvite).filter(WorkspaceInvite.id == invite_id).first()
        if not invite:
            raise HTTPException(
                status_code=404,
                detail="This invite is no longer available. It may have expired or been revoked.",
            )
        if invite.status != "pending":
            raise HTTPException(status_code=400, detail="Only pending invites can be revoked.")
        invite.status = "revoked"
        db.commit()

    def _require_open(self, db: Session, token: str) -> WorkspaceInvite:
        self._expire_stale(db)
        invite = db.query(WorkspaceInvite).filter(WorkspaceInvite.token == token).first()
        if not invite:
            raise HTTPException(
                status_code=404,
                detail="This invite is no longer available. It may have expired or been revoked.",
            )
        if invite.status == "accepted":
            raise HTTPException(status_code=409, detail="This invite was already accepted. Sign in instead.")
        if invite.status != "pending":
            raise HTTPException(
                status_code=400,
                detail="This invite is no longer valid. Ask a teammate to send a new one.",
            )
        return invite

    def _expire_stale(self, db: Session) -> None:
        stale = (
            db.query(WorkspaceInvite)
            .filter(WorkspaceInvite.status == "pending", WorkspaceInvite.expires_at < datetime.utcnow())
            .all()
        )
        for invite in stale:
            invite.status = "expired"
        if stale:
            db.commit()
