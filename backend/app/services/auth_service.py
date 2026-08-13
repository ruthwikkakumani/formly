from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_token, hash_password, verify_password
from app.models import Member, PasswordReset
from app.schemas.auth import (
    ChangePasswordPayload,
    ForgotPasswordPayload,
    LoginPayload,
    ProfileUpdatePayload,
    RegisterPayload,
    ResetPasswordPayload,
)
from app.services.email_service import schedule_reset_email
from app.services.team_service import TeamService

FORGOT_MESSAGE = "If that email is in this workspace, we've sent a reset link. Check your inbox."


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
        if db.query(Member).filter(Member.role == "owner").first():
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

    def request_reset(self, db: Session, payload: ForgotPasswordPayload) -> dict:
        email = str(payload.email).lower()
        member = db.query(Member).filter(Member.email == email).first()
        result: dict = {"ok": True, "message": FORGOT_MESSAGE}
        if not member:
            return result
        pending = (
            db.query(PasswordReset)
            .filter(PasswordReset.member_id == member.id, PasswordReset.used_at.is_(None))
            .all()
        )
        for row in pending:
            row.used_at = datetime.utcnow()
        reset = PasswordReset(member_id=member.id, email=email)
        db.add(reset)
        db.commit()
        db.refresh(reset)
        reset_url = f"{settings.frontend_url.rstrip('/')}/reset/{reset.token}"
        schedule_reset_email(email, member.name, reset_url)
        if settings.is_local_dev:
            result["reset_url"] = reset_url
            result["message"] = (
                "If that email is in this workspace, we've sent a reset link. "
                "If it doesn't arrive, copy the link below."
            )
        return result

    def preview_reset(self, db: Session, token: str) -> dict:
        reset = self._require_open_reset(db, token)
        return {"email": reset.email, "expires_at": reset.expires_at}

    def reset_password(self, db: Session, token: str, payload: ResetPasswordPayload) -> dict:
        reset = self._require_open_reset(db, token)
        member = db.query(Member).filter(Member.id == reset.member_id).first()
        if not member:
            raise HTTPException(
                status_code=404,
                detail="This reset link is no longer valid. Request a new one from the sign-in page.",
            )
        member.password_hash = hash_password(payload.password)
        reset.used_at = datetime.utcnow()
        db.commit()
        db.refresh(member)
        return self.session(member)

    def update_profile(self, db: Session, member: Member, payload: ProfileUpdatePayload) -> dict:
        row = db.query(Member).filter(Member.id == member.id).first()
        if not row:
            raise HTTPException(status_code=401, detail="Sign in to continue.")
        row.name = payload.name
        db.commit()
        db.refresh(row)
        return TeamService().serialize(row)

    def change_password(self, db: Session, member: Member, payload: ChangePasswordPayload) -> dict:
        row = db.query(Member).filter(Member.id == member.id).first()
        if not row:
            raise HTTPException(status_code=401, detail="Sign in to continue.")
        if not verify_password(payload.current_password, row.password_hash or ""):
            raise HTTPException(status_code=401, detail="That current password is incorrect.")
        if payload.current_password == payload.new_password:
            raise HTTPException(status_code=400, detail="Choose a new password that is different from the current one.")
        row.password_hash = hash_password(payload.new_password)
        db.commit()
        return {"ok": True, "message": "Your password has been updated."}

    def _require_open_reset(self, db: Session, token: str) -> PasswordReset:
        reset = db.query(PasswordReset).filter(PasswordReset.token == token).first()
        if not reset:
            raise HTTPException(
                status_code=404,
                detail="This reset link is no longer valid. Request a new one from the sign-in page.",
            )
        if reset.used_at is not None or reset.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=400,
                detail="This reset link is no longer valid. Request a new one from the sign-in page.",
            )
        return reset
