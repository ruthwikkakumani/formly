from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_owner
from app.db.session import get_db
from app.schemas.auth import AcceptInvitePayload
from app.schemas.member import MemberPayload
from app.services.invite_service import InviteService

router = APIRouter(tags=["invites"])
service = InviteService()


@router.get("/workspace/invites")
def list_invites(db: Session = Depends(get_db), user: Member = Depends(require_owner)):
    return service.list_pending(db)


@router.post("/workspace/invites")
async def create_invite(
    payload: MemberPayload,
    db: Session = Depends(get_db),
    user: Member = Depends(require_owner),
):
    return service.create(db, payload)


@router.delete("/workspace/invites/{invite_id}")
def revoke_invite(invite_id: int, db: Session = Depends(get_db), user: Member = Depends(require_owner)):
    service.revoke(db, invite_id)
    return {"ok": True}


@router.get("/invites/{token}")
def preview_invite(token: str, db: Session = Depends(get_db)):
    return service.preview(db, token)


@router.post("/invites/{token}/accept")
def accept_invite(token: str, payload: AcceptInvitePayload, db: Session = Depends(get_db)):
    return service.accept(db, token, payload.password)
