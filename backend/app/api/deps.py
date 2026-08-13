from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import read_token
from app.db.session import get_db
from app.models import Member
from app.services.form_service import FormService
from app.services.response_service import ResponseService

form_service = FormService()
response_service = ResponseService()
bearer = HTTPBearer(auto_error=False)

OWNER_DETAIL = "Only the workspace owner can invite or remove teammates."
VIEW_ONLY_DETAIL = "You have view-only access. Ask the owner to make you an editor."


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> Member:
    if not creds or creds.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Sign in to continue.")
    payload = read_token(creds.credentials)
    member = db.query(Member).filter(Member.id == int(payload["sub"])).first()
    if not member:
        raise HTTPException(status_code=401, detail="Sign in to continue.")
    return member


def require_owner(user: Member = Depends(get_current_user)) -> Member:
    if user.role != "owner":
        raise HTTPException(status_code=403, detail=OWNER_DETAIL)
    return user


def require_editor(user: Member = Depends(get_current_user)) -> Member:
    if user.role == "viewer":
        raise HTTPException(status_code=403, detail=VIEW_ONLY_DETAIL)
    return user
