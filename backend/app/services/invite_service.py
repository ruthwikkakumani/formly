from datetime import datetime
from uuid import uuid4

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants import INVITE_ACCEPTED, INVITE_EXPIRED, INVITE_PENDING, INVITE_REVOKED, INVITE_ROLES
from app.core.exceptions import AppError
from app.core.security import hash_password
from app.models import Member
from app.models.invite import WorkspaceInvite, _invite_expiry
from app.repositories.invite_repository import InviteRepository
from app.repositories.member_repository import MemberRepository
from app.schemas.member import EMAIL_PATTERN, InviteRead, MemberPayload
from app.services.auth_service import AuthService
from app.services.email_service import schedule_invite_email


class InviteService:
    def __init__(
        self,
        invites: InviteRepository | None = None,
        members: MemberRepository | None = None,
        auth: AuthService | None = None,
    ) -> None:
        self.invites = invites or InviteRepository()
        self.members = members or MemberRepository()
        self.auth = auth or AuthService()

    def serialize(self, invite: WorkspaceInvite, include_accept_url: bool = True) -> dict:
        data = InviteRead(
            id=invite.id,
            email=invite.email,
            name=invite.name,
            role=invite.role,
            status=invite.status,
            created_at=invite.created_at,
            expires_at=invite.expires_at,
            email_error=invite.email_error,
            accept_url=f"{settings.frontend_url.rstrip('/')}/invite/{invite.token}" if include_accept_url else None,
        ).model_dump()
        if not include_accept_url:
            data.pop("accept_url", None)
        return data

    def list_pending(self, db: Session, include_accept_url: bool = True) -> list[dict]:
        self._expire_stale(db)
        return [self.serialize(invite, include_accept_url=include_accept_url) for invite in self.invites.list_pending(db)]

    def create(self, db: Session, payload: MemberPayload) -> dict:
        self._expire_stale(db)
        email = str(payload.email).strip().lower()
        if not payload.name.strip():
            raise AppError(422, "Enter a name.")
        if not EMAIL_PATTERN.match(email):
            raise AppError(422, "Enter a valid email address.")
        role = payload.role if payload.role in INVITE_ROLES else "editor"
        if self.members.get_by_email(db, email):
            raise AppError(409, "That person is already in this workspace.")
        invite = self.invites.get_pending_by_email(db, email)
        if invite:
            invite.name = payload.name.strip()
            invite.role = role
            invite.token = uuid4().hex
            invite.expires_at = _invite_expiry()
            invite.email_error = None
        else:
            invite = self.invites.add(db, WorkspaceInvite(name=payload.name.strip(), email=email, role=role))
        accept_url = f"{settings.frontend_url.rstrip('/')}/invite/{invite.token}"
        try:
            db.commit()
            db.refresh(invite)
        except Exception as error:
            db.rollback()
            print(f"Workspace invite persist failed: {error!r}", flush=True)
            raise AppError(502, "We couldn't create that invite. Please try again.") from error

        schedule_invite_email(invite.id, email, invite.name, invite.role, accept_url)
        return {
            "invite": self.serialize(invite),
            "email_sent": False,
            "accept_url": accept_url,
            "message": "Invite created. Copy the invite link if they don't get the email.",
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
        if self.members.get_by_email(db, invite.email):
            raise AppError(409, "That email already has an account. Sign in instead.")
        member = self.members.add(
            db,
            Member(
                name=invite.name,
                email=invite.email,
                role=invite.role,
                password_hash=hash_password(password),
            ),
        )
        invite.status = INVITE_ACCEPTED
        invite.accepted_at = datetime.utcnow()
        db.commit()
        db.refresh(member)
        return self.auth.session(member)

    def revoke(self, db: Session, invite_id: int) -> None:
        invite = self.invites.get(db, invite_id)
        if not invite:
            raise AppError(404, "This invite is no longer available. It may have expired or been revoked.")
        if invite.status != INVITE_PENDING:
            raise AppError(400, "Only pending invites can be revoked.")
        invite.status = INVITE_REVOKED
        db.commit()

    def _require_open(self, db: Session, token: str) -> WorkspaceInvite:
        self._expire_stale(db)
        invite = self.invites.get_by_token(db, token)
        if not invite:
            raise AppError(404, "This invite is no longer available. It may have expired or been revoked.")
        if invite.status == INVITE_ACCEPTED:
            raise AppError(409, "This invite was already accepted. Sign in instead.")
        if invite.status != INVITE_PENDING:
            raise AppError(400, "This invite is no longer valid. Ask a teammate to send a new one.")
        return invite

    def _expire_stale(self, db: Session) -> None:
        stale = self.invites.list_stale_pending(db, datetime.utcnow())
        for invite in stale:
            invite.status = INVITE_EXPIRED
        if stale:
            db.commit()
