from datetime import datetime

from sqlalchemy.orm import Session

from app.models import FormActivity, FormPresence


class CollaborationRepository:
    def get_presence(self, db: Session, form_id: int, email: str) -> FormPresence | None:
        return (
            db.query(FormPresence)
            .filter(FormPresence.form_id == form_id, FormPresence.email == email)
            .first()
        )

    def add_presence(self, db: Session, row: FormPresence) -> None:
        db.add(row)

    def delete_presence(self, db: Session, form_id: int, email: str) -> None:
        db.query(FormPresence).filter(FormPresence.form_id == form_id, FormPresence.email == email).delete()

    def delete_stale(self, db: Session, cutoff: datetime) -> None:
        db.query(FormPresence).filter(FormPresence.last_seen < cutoff).delete()

    def list_active(self, db: Session, form_id: int, cutoff: datetime) -> list[FormPresence]:
        return (
            db.query(FormPresence)
            .filter(FormPresence.form_id == form_id, FormPresence.last_seen >= cutoff)
            .order_by(FormPresence.name.asc())
            .all()
        )

    def add_activity(self, db: Session, row: FormActivity) -> None:
        db.add(row)

    def list_activity(self, db: Session, form_id: int, limit: int = 40) -> list[FormActivity]:
        return (
            db.query(FormActivity)
            .filter(FormActivity.form_id == form_id)
            .order_by(FormActivity.created_at.desc())
            .limit(limit)
            .all()
        )
