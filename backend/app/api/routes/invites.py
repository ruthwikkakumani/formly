from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, invite_service, require_owner
from app.core.constants import ROLE_OWNER
from app.db.session import get_db
from app.models import Member
from app.schemas.auth import AcceptInvitePayload
from app.schemas.member import MemberPayload

router = APIRouter(tags=["invites"])


@router.get("/workspace/invites")
def list_invites(db: Session = Depends(get_db), user: Member = Depends(get_current_user)):
    return invite_service.list_pending(db, include_accept_url=user.role == ROLE_OWNER)


@router.post("/workspace/invites")
async def create_invite(
    payload: MemberPayload,
    db: Session = Depends(get_db),
    user: Member = Depends(require_owner),
):
    return invite_service.create(db, payload)


@router.delete("/workspace/invites/{invite_id}")
def revoke_invite(invite_id: int, db: Session = Depends(get_db), user: Member = Depends(require_owner)):
    invite_service.revoke(db, invite_id)
    return {"ok": True}


@router.get("/invites/{token}")
def preview_invite(token: str, db: Session = Depends(get_db)):
    return invite_service.preview(db, token)


@router.post("/invites/{token}/accept")
def accept_invite(token: str, payload: AcceptInvitePayload, db: Session = Depends(get_db)):
    return invite_service.accept(db, token, payload.password)
