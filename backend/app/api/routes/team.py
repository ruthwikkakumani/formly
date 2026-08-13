from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_owner
from app.db.session import get_db
from app.models import Member
from app.schemas.member import MemberPayload, RoleUpdatePayload
from app.services.invite_service import InviteService
from app.services.team_service import TeamService

router = APIRouter(prefix="/workspace/members", tags=["workspace"], dependencies=[Depends(get_current_user)])
service = TeamService()
invites = InviteService()


@router.get("")
def list_members(db: Session = Depends(get_db), _user: Member = Depends(get_current_user)):
    """Any signed-in member can see the workspace roster. Invite/remove stay owner-only."""
    return service.list(db)


@router.post("")
def invite_member(payload: MemberPayload, db: Session = Depends(get_db), user: Member = Depends(require_owner)):
    return invites.create(db, payload)


@router.patch("/{member_id}")
def update_member_role(
    member_id: int,
    payload: RoleUpdatePayload,
    db: Session = Depends(get_db),
    user: Member = Depends(require_owner),
):
    return service.update_role(db, member_id, payload.role)


@router.delete("/{member_id}")
def remove_member(member_id: int, db: Session = Depends(get_db), user: Member = Depends(require_owner)):
    service.remove(db, member_id)
    return {"ok": True}
