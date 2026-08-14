from sqlalchemy.orm import Session

from app.models import PasswordReset


class PasswordResetRepository:
    def get_by_token(self, db: Session, token: str) -> PasswordReset | None:
        return db.query(PasswordReset).filter(PasswordReset.token == token).first()

    def list_open_for_member(self, db: Session, member_id: int) -> list[PasswordReset]:
        return (
            db.query(PasswordReset)
            .filter(PasswordReset.member_id == member_id, PasswordReset.used_at.is_(None))
            .all()
        )

    def add(self, db: Session, reset: PasswordReset) -> PasswordReset:
        db.add(reset)
        db.flush()
        return reset
