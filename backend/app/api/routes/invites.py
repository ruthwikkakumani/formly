from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Member
from app.schemas.auth import AcceptInvitePayload
from app.schemas.member import MemberPayload
from app.services.invite_service import InviteService

router = APIRouter(tags=["invites"])
service = InviteService()


def _can_manage(user: Member) -> None:
    if user.role not in {"owner", "editor"}:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to manage invites. Ask an editor or the owner.",
        )


@router.get("/workspace/invites")
def list_invites(db: Session = Depends(get_db), user: Member = Depends(get_current_user)):
    return service.list_pending(db)


@router.post("/workspace/invites")
def create_invite(payload: MemberPayload, db: Session = Depends(get_db), user: Member = Depends(get_current_user)):
    _can_manage(user)
    return service.create(db, payload)


@router.delete("/workspace/invites/{invite_id}")
def revoke_invite(invite_id: int, db: Session = Depends(get_db), user: Member = Depends(get_current_user)):
    _can_manage(user)
    service.revoke(db, invite_id)
    return {"ok": True}


@router.get("/invites/{token}")
def preview_invite(token: str, db: Session = Depends(get_db)):
    return service.preview(db, token)


@router.post("/invites/{token}/accept")
def accept_invite(token: str, payload: AcceptInvitePayload, db: Session = Depends(get_db)):
    return service.accept(db, token, payload.password)
