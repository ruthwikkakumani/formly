from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.constants import ROLE_OWNER, ROLE_VIEWER
from app.core.exceptions import AppError
from app.core.security import read_token
from app.db.session import get_db
from app.models import Member
from app.repositories.member_repository import MemberRepository
from app.services.auth_service import AuthService
from app.services.collaboration_service import CollaborationService
from app.services.form_service import FormService
from app.services.invite_service import InviteService
from app.services.response_service import ResponseService
from app.services.team_service import TeamService

member_repo = MemberRepository()
collab_service = CollaborationService()
form_service = FormService(collab=collab_service)
response_service = ResponseService(forms=form_service)
auth_service = AuthService()
team_service = TeamService()
invite_service = InviteService(auth=auth_service)
bearer = HTTPBearer(auto_error=False)

OWNER_DETAIL = "Only the workspace owner can invite or remove teammates."
VIEW_ONLY_DETAIL = "You have view-only access. Ask the owner to make you an editor."


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> Member:
    if not creds or creds.scheme.lower() != "bearer":
        raise AppError(401, "Sign in to continue.")
    payload = read_token(creds.credentials)
    member = member_repo.get(db, int(payload["sub"]))
    if not member:
        raise AppError(401, "Sign in to continue.")
    return member


def require_owner(user: Member = Depends(get_current_user)) -> Member:
    if user.role != ROLE_OWNER:
        raise AppError(403, OWNER_DETAIL)
    return user


def require_editor(user: Member = Depends(get_current_user)) -> Member:
    if user.role == ROLE_VIEWER:
        raise AppError(403, VIEW_ONLY_DETAIL)
    return user
