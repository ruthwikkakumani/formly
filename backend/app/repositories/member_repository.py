from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.constants import ROLE_OWNER
from app.models import Member


class MemberRepository:
    def get(self, db: Session, member_id: int) -> Member | None:
        return db.query(Member).filter(Member.id == member_id).first()

    def get_by_email(self, db: Session, email: str) -> Member | None:
        return db.query(Member).filter(Member.email == email).first()

    def get_owner(self, db: Session) -> Member | None:
        return db.query(Member).filter(Member.role == ROLE_OWNER).first()

    def list(self, db: Session) -> list[Member]:
        return db.query(Member).order_by(Member.created_at.asc()).all()

    def add(self, db: Session, member: Member) -> Member:
        db.add(member)
        db.flush()
        return member

    def delete(self, db: Session, member: Member) -> None:
        db.delete(member)

    def delete_placeholder_accounts(self, db: Session) -> None:
        db.query(Member).filter(or_(Member.password_hash.is_(None), Member.password_hash == "")).delete(
            synchronize_session=False
        )
