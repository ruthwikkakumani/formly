from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_owner
from app.db.session import get_db
from app.models import Member
from app.schemas.member import MemberPayload
from app.services.invite_service import InviteService
from app.services.team_service import TeamService

router = APIRouter(prefix="/workspace/members", tags=["workspace"], dependencies=[Depends(get_current_user)])
service = TeamService()
invites = InviteService()


@router.get("")
def list_members(db: Session = Depends(get_db)):
    return service.list(db)


@router.post("")
def invite_member(payload: MemberPayload, db: Session = Depends(get_db), user: Member = Depends(require_owner)):
    return invites.create(db, payload)


@router.delete("/{member_id}")
def remove_member(member_id: int, db: Session = Depends(get_db), user: Member = Depends(require_owner)):
    service.remove(db, member_id)
    return {"ok": True}
