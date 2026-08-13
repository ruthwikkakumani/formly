from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models import FormActivity, FormPresence

STALE_AFTER = timedelta(seconds=20)


class CollaborationService:
    def heartbeat(self, db: Session, form_id: int, name: str, email: str) -> list[dict]:
        key = (email or name or "anonymous").strip().lower()
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
