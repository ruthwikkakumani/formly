from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Member
from app.schemas.member import MemberPayload


class TeamService:
    def serialize(self, member: Member) -> dict:
        return {
            "id": member.id,
            "name": member.name,
            "email": member.email,
            "role": member.role,
            "created_at": member.created_at,
        }

    def list(self, db: Session) -> list[dict]:
        members = db.query(Member).order_by(Member.created_at.asc()).all()
        return [self.serialize(member) for member in members]

    def invite(self, db: Session, payload: MemberPayload) -> dict:
        role = payload.role if payload.role in {"owner", "editor", "viewer"} else "editor"
        if db.query(Member).filter(Member.email == str(payload.email).lower()).first():
            raise HTTPException(status_code=409, detail="That person is already in this workspace.")
        member = Member(name=payload.name.strip(), email=str(payload.email).lower(), role=role)
        db.add(member)
        db.commit()
        db.refresh(member)
        return self.serialize(member)

    def remove(self, db: Session, member_id: int) -> None:
        member = db.query(Member).filter(Member.id == member_id).first()
        if not member:
            raise HTTPException(status_code=404, detail="We couldn't find that teammate.")
        if member.role == "owner":
            raise HTTPException(status_code=400, detail="The workspace owner cannot be removed.")
        db.delete(member)
        db.commit()
