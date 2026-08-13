from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import FormActivity, FormPresence

STALE_AFTER = timedelta(seconds=8)


def _email_key(email: str) -> str:
    return (email or "").strip().lower()


class CollaborationService:
    def heartbeat(self, db: Session, form_id: int, name: str, email: str) -> list[dict]:
        key = _email_key(email)
        if not key:
            raise HTTPException(status_code=400, detail="Presence requires a signed-in email.")
        self._clear_legacy_name_row(db, form_id, name, key)
        row = (
            db.query(FormPresence)
            .filter(FormPresence.form_id == form_id, FormPresence.email == key)
            .first()
        )
        now = datetime.utcnow()
        if row:
            row.name = name or row.name
            row.last_seen = now
        else:
            db.add(FormPresence(form_id=form_id, name=name or "Teammate", email=key, last_seen=now))
        db.commit()
        return self.active_editors(db, form_id)

    def leave(self, db: Session, form_id: int, name: str, email: str) -> dict:
        key = _email_key(email)
        if key:
            db.query(FormPresence).filter(FormPresence.form_id == form_id, FormPresence.email == key).delete()
        self._clear_legacy_name_row(db, form_id, name, key)
        db.commit()
        return {"ok": True}

    def _clear_legacy_name_row(self, db: Session, form_id: int, name: str, email_key: str) -> None:
        legacy = (name or "").strip().lower()
        if legacy and legacy != email_key:
            db.query(FormPresence).filter(FormPresence.form_id == form_id, FormPresence.email == legacy).delete()

    def active_editors(self, db: Session, form_id: int) -> list[dict]:
        cutoff = datetime.utcnow() - STALE_AFTER
        db.query(FormPresence).filter(FormPresence.last_seen < cutoff).delete()
        db.commit()
        rows = (
            db.query(FormPresence)
            .filter(FormPresence.form_id == form_id, FormPresence.last_seen >= cutoff)
            .order_by(FormPresence.name.asc())
            .all()
        )
        return [
            {"name": row.name, "email": row.email, "last_seen": row.last_seen}
            for row in rows
        ]

    def log(self, db: Session, form_id: int, action: str, name: str, email: str, detail: str = "") -> None:
        db.add(
            FormActivity(
                form_id=form_id,
                actor_name=name or "Unknown",
                actor_email=email or "",
                action=action,
                detail=detail,
            )
        )

    def history(self, db: Session, form_id: int) -> list[dict]:
        rows = (
            db.query(FormActivity)
            .filter(FormActivity.form_id == form_id)
            .order_by(FormActivity.created_at.desc())
            .limit(40)
            .all()
        )
        return [
            {
                "id": row.id,
                "actor_name": row.actor_name,
                "actor_email": row.actor_email,
                "action": row.action,
                "detail": row.detail,
                "created_at": row.created_at,
            }
            for row in rows
        ]
