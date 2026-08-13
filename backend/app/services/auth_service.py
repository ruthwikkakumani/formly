from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.security import create_token, hash_password, verify_password
from app.models import Member
from app.schemas.auth import LoginPayload, RegisterPayload
from app.services.team_service import TeamService


class AuthService:
    def session(self, member: Member) -> dict:
        return {
            "token": create_token(member.id, member.email),
            "user": TeamService().serialize(member),
        }

    def register(self, db: Session, payload: RegisterPayload) -> dict:
        email = str(payload.email).lower()
        if db.query(Member).filter(Member.email == email).first():
            raise HTTPException(
                status_code=409,
                detail="An account with this email already exists. Sign in instead.",
            )
        real_users = (
            db.query(Member)
            .filter(Member.password_hash.is_not(None), Member.password_hash != "")
            .count()
        )
        if real_users:
            raise HTTPException(
                status_code=403,
                detail="This workspace already has an owner. Sign in with that account, or ask them to send you an invite.",
            )
        db.query(Member).filter(or_(Member.password_hash.is_(None), Member.password_hash == "")).delete(
            synchronize_session=False
        )
        member = Member(
            name=payload.name.strip(),
            email=email,
            role="owner",
            password_hash=hash_password(payload.password),
        )
        db.add(member)
        db.commit()
        db.refresh(member)
        return self.session(member)

    def login(self, db: Session, payload: LoginPayload) -> dict:
        email = str(payload.email).lower()
        member = db.query(Member).filter(Member.email == email).first()
        if not member or not verify_password(payload.password, member.password_hash or ""):
            raise HTTPException(status_code=401, detail="That email or password is incorrect.")
        return self.session(member)
