from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Member
from app.schemas.auth import LoginPayload, RegisterPayload
from app.services.auth_service import AuthService
from app.services.team_service import TeamService

router = APIRouter(prefix="/auth", tags=["auth"])
service = AuthService()


@router.post("/register")
def register(payload: RegisterPayload, db: Session = Depends(get_db)):
    return service.register(db, payload)


@router.post("/login")
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    return service.login(db, payload)


@router.get("/me")
def me(user: Member = Depends(get_current_user)):
    return TeamService().serialize(user)
