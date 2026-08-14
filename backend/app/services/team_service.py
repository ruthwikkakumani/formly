from sqlalchemy.orm import Session

from app.core.constants import ASSIGNABLE_ROLES, ROLE_OWNER
from app.core.exceptions import AppError
from app.models import Member
from app.repositories.member_repository import MemberRepository
from app.schemas.member import MemberRead


class TeamService:
    def __init__(self, members: MemberRepository | None = None) -> None:
        self.members = members or MemberRepository()

    def serialize(self, member: Member) -> dict:
        return MemberRead.dump(member)

    def list(self, db: Session) -> list[dict]:
        return [self.serialize(member) for member in self.members.list(db)]

    def update_role(self, db: Session, member_id: int, role: str) -> dict:
        member = self.members.get(db, member_id)
        if not member:
            raise AppError(404, "We couldn't find that teammate.")
        if member.role == ROLE_OWNER:
            raise AppError(400, "The workspace owner's role cannot be changed.")
        if role not in ASSIGNABLE_ROLES:
            raise AppError(400, "Role must be editor or viewer.")
        member.role = role
        db.commit()
        db.refresh(member)
        return self.serialize(member)

    def remove(self, db: Session, member_id: int) -> None:
        member = self.members.get(db, member_id)
        if not member:
            raise AppError(404, "We couldn't find that teammate.")
        if member.role == ROLE_OWNER:
            raise AppError(400, "The workspace owner cannot be removed.")
        self.members.delete(db, member)
        db.commit()
