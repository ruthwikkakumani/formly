from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Member
from app.schemas.member import MemberPayload
from app.services.invite_service import InviteService
from app.services.team_service import TeamService

router = APIRouter(prefix="/workspace/members", tags=["workspace"], dependencies=[Depends(get_current_user)])
service = TeamService()
invites = InviteService()


def _can_manage(user: Member) -> None:
    if user.role not in {"owner", "editor"}:
        raise HTTPException(status_code=403, detail="Editors can manage the workspace")


@router.get("")
def list_members(db: Session = Depends(get_db)):
    return service.list(db)


@router.post("")
def invite_member(payload: MemberPayload, db: Session = Depends(get_db), user: Member = Depends(get_current_user)):
    _can_manage(user)
    return invites.create(db, payload)


@router.delete("/{member_id}")
def remove_member(member_id: int, db: Session = Depends(get_db), user: Member = Depends(get_current_user)):
    _can_manage(user)
    service.remove(db, member_id)
    return {"ok": True}
