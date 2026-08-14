from datetime import datetime

from sqlalchemy.orm import Session

from app.core.constants import INVITE_PENDING
from app.models import WorkspaceInvite


class InviteRepository:
    def get(self, db: Session, invite_id: int) -> WorkspaceInvite | None:
        return db.query(WorkspaceInvite).filter(WorkspaceInvite.id == invite_id).first()

    def get_by_token(self, db: Session, token: str) -> WorkspaceInvite | None:
        return db.query(WorkspaceInvite).filter(WorkspaceInvite.token == token).first()

    def get_pending_by_email(self, db: Session, email: str) -> WorkspaceInvite | None:
        return (
            db.query(WorkspaceInvite)
            .filter(WorkspaceInvite.email == email, WorkspaceInvite.status == INVITE_PENDING)
            .first()
        )

    def list_pending(self, db: Session) -> list[WorkspaceInvite]:
        return (
            db.query(WorkspaceInvite)
            .filter(WorkspaceInvite.status == INVITE_PENDING)
            .order_by(WorkspaceInvite.created_at.desc())
            .all()
        )

    def list_stale_pending(self, db: Session, now: datetime) -> list[WorkspaceInvite]:
        return (
            db.query(WorkspaceInvite)
            .filter(WorkspaceInvite.status == INVITE_PENDING, WorkspaceInvite.expires_at < now)
            .all()
        )

    def add(self, db: Session, invite: WorkspaceInvite) -> WorkspaceInvite:
        db.add(invite)
        db.flush()
        return invite
