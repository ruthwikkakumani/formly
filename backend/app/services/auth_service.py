from datetime import datetime

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants import ROLE_EDITOR, ROLE_OWNER, ROLE_VIEWER
from app.core.exceptions import AppError
from app.core.security import create_token, hash_password, verify_password
from app.models import Member, PasswordReset
from app.repositories.member_repository import MemberRepository
from app.repositories.password_reset_repository import PasswordResetRepository
from app.schemas.auth import (
    ChangePasswordPayload,
    DemoAccountRead,
    ForgotPasswordPayload,
    LoginPayload,
    ProfileUpdatePayload,
    RegisterPayload,
    ResetPasswordPayload,
    SessionRead,
)
from app.schemas.member import MemberRead
from app.services.email_service import schedule_reset_email

FORGOT_MESSAGE = "If that email is in this workspace, we've sent a reset link. Check your inbox."


class AuthService:
    def __init__(
        self,
        members: MemberRepository | None = None,
        resets: PasswordResetRepository | None = None,
    ) -> None:
        self.members = members or MemberRepository()
        self.resets = resets or PasswordResetRepository()

    def demo_accounts(self) -> list[dict]:
        rows = []
        for role, label, email, password in (
            (ROLE_OWNER, "Owner", settings.owner_email, settings.owner_password),
            (ROLE_EDITOR, "Reviewer", settings.reviewer_email, settings.reviewer_password),
            (ROLE_VIEWER, "Viewer", settings.viewer_email, settings.viewer_password),
        ):
            clean_email = (email or "").strip().lower()
            clean_password = password or ""
            if clean_email and len(clean_password) >= 8:
                rows.append(
                    DemoAccountRead(
                        role=role,
                        label=label,
                        email=clean_email,
                        password=clean_password,
                    ).model_dump()
                )
        return rows

    def session(self, member: Member) -> dict:
        return SessionRead(token=create_token(member.id, member.email), user=MemberRead.model_validate(member)).model_dump()

    def serialize_member(self, member: Member) -> dict:
        return MemberRead.dump(member)

    def register(self, db: Session, payload: RegisterPayload) -> dict:
        email = str(payload.email).lower()
        if self.members.get_by_email(db, email):
            raise AppError(409, "An account with this email already exists. Sign in instead.")
        if self.members.get_owner(db):
            raise AppError(
                403,
                "This workspace already has an owner. Sign in with that account, or ask them to send you an invite.",
            )
        self.members.delete_placeholder_accounts(db)
        member = self.members.add(
            db,
            Member(
                name=payload.name.strip(),
                email=email,
                role=ROLE_OWNER,
                password_hash=hash_password(payload.password),
            ),
        )
        db.commit()
        db.refresh(member)
        return self.session(member)

    def login(self, db: Session, payload: LoginPayload) -> dict:
        email = str(payload.email).lower()
        member = self.members.get_by_email(db, email)
        if not member or not verify_password(payload.password, member.password_hash or ""):
            raise AppError(401, "That email or password is incorrect.")
        return self.session(member)

    def request_reset(self, db: Session, payload: ForgotPasswordPayload) -> dict:
        email = str(payload.email).lower()
        member = self.members.get_by_email(db, email)
        result: dict = {"ok": True, "message": FORGOT_MESSAGE}
        if not member:
            return result
        for row in self.resets.list_open_for_member(db, member.id):
            row.used_at = datetime.utcnow()
        reset = self.resets.add(db, PasswordReset(member_id=member.id, email=email))
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
        member = self.members.get(db, reset.member_id)
        if not member:
            raise AppError(404, "This reset link is no longer valid. Request a new one from the sign-in page.")
        member.password_hash = hash_password(payload.password)
        reset.used_at = datetime.utcnow()
        db.commit()
        db.refresh(member)
        return self.session(member)

    def update_profile(self, db: Session, member: Member, payload: ProfileUpdatePayload) -> dict:
        row = self.members.get(db, member.id)
        if not row:
            raise AppError(401, "Sign in to continue.")
        row.name = payload.name
        db.commit()
        db.refresh(row)
        return self.serialize_member(row)

    def change_password(self, db: Session, member: Member, payload: ChangePasswordPayload) -> dict:
        row = self.members.get(db, member.id)
        if not row:
            raise AppError(401, "Sign in to continue.")
        if not verify_password(payload.current_password, row.password_hash or ""):
            raise AppError(401, "That current password is incorrect.")
        if payload.current_password == payload.new_password:
            raise AppError(400, "Choose a new password that is different from the current one.")
        row.password_hash = hash_password(payload.new_password)
        db.commit()
        return {"ok": True, "message": "Your password has been updated."}

    def _require_open_reset(self, db: Session, token: str) -> PasswordReset:
        reset = self.resets.get_by_token(db, token)
        if not reset:
            raise AppError(404, "This reset link is no longer valid. Request a new one from the sign-in page.")
        if reset.used_at is not None or reset.expires_at < datetime.utcnow():
            raise AppError(400, "This reset link is no longer valid. Request a new one from the sign-in page.")
        return reset
