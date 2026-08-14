from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Member
from app.schemas.auth import (
    ChangePasswordPayload,
    ForgotPasswordPayload,
    LoginPayload,
    ProfileUpdatePayload,
    RegisterPayload,
    ResetPasswordPayload,
)
from app.services.auth_service import AuthService
from app.services.team_service import TeamService

router = APIRouter(prefix="/auth", tags=["auth"])
service = AuthService()


@router.get("/demo")
def demo_accounts():
    return service.demo_accounts()


@router.post("/register")
def register(payload: RegisterPayload, db: Session = Depends(get_db)):
    return service.register(db, payload)


@router.post("/login")
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    return service.login(db, payload)


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordPayload, db: Session = Depends(get_db)):
    return service.request_reset(db, payload)


@router.get("/reset-password/{token}")
def preview_reset(token: str, db: Session = Depends(get_db)):
    return service.preview_reset(db, token)


@router.post("/reset-password/{token}")
def reset_password(token: str, payload: ResetPasswordPayload, db: Session = Depends(get_db)):
    return service.reset_password(db, token, payload)


@router.get("/me")
def me(user: Member = Depends(get_current_user)):
    return TeamService().serialize(user)


@router.patch("/me")
def update_me(
    payload: ProfileUpdatePayload,
    db: Session = Depends(get_db),
    user: Member = Depends(get_current_user),
):
    return service.update_profile(db, user, payload)


@router.post("/password")
def change_password(
    payload: ChangePasswordPayload,
    db: Session = Depends(get_db),
    user: Member = Depends(get_current_user),
):
    return service.change_password(db, user, payload)
