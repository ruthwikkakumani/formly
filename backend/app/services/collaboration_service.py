from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models import FormActivity, FormPresence
from app.repositories.collaboration_repository import CollaborationRepository
from app.schemas.form import ActivityRead, PresenceRead

STALE_AFTER = timedelta(seconds=8)


def _email_key(email: str) -> str:
    return (email or "").strip().lower()


class CollaborationService:
    def __init__(self, repo: CollaborationRepository | None = None) -> None:
        self.repo = repo or CollaborationRepository()

    def heartbeat(self, db: Session, form_id: int, name: str, email: str) -> list[dict]:
        key = _email_key(email)
        if not key:
            raise AppError(400, "Presence requires a signed-in email.")
        self._clear_legacy_name_row(db, form_id, name, key)
        row = self.repo.get_presence(db, form_id, key)
        now = datetime.utcnow()
        if row:
            row.name = name or row.name
            row.last_seen = now
        else:
            self.repo.add_presence(db, FormPresence(form_id=form_id, name=name or "Teammate", email=key, last_seen=now))
        db.commit()
        return self.active_editors(db, form_id)

    def leave(self, db: Session, form_id: int, name: str, email: str) -> dict:
        key = _email_key(email)
        if key:
            self.repo.delete_presence(db, form_id, key)
        self._clear_legacy_name_row(db, form_id, name, key)
        db.commit()
        return {"ok": True}

    def _clear_legacy_name_row(self, db: Session, form_id: int, name: str, email_key: str) -> None:
        legacy = (name or "").strip().lower()
        if legacy and legacy != email_key:
            self.repo.delete_presence(db, form_id, legacy)

    def active_editors(self, db: Session, form_id: int) -> list[dict]:
        cutoff = datetime.utcnow() - STALE_AFTER
        self.repo.delete_stale(db, cutoff)
        db.commit()
        return [PresenceRead.model_validate(row).model_dump() for row in self.repo.list_active(db, form_id, cutoff)]

    def log(self, db: Session, form_id: int, action: str, name: str, email: str, detail: str = "") -> None:
        self.repo.add_activity(
            db,
            FormActivity(
                form_id=form_id,
                actor_name=name or "Unknown",
                actor_email=email or "",
                action=action,
                detail=detail,
            ),
        )

    def history(self, db: Session, form_id: int) -> list[dict]:
        return [ActivityRead.model_validate(row).model_dump() for row in self.repo.list_activity(db, form_id)]
