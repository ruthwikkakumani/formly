from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.member import MemberPayload
from app.services.team_service import TeamService

router = APIRouter(prefix="/workspace/members", tags=["workspace"])
service = TeamService()


@router.get("")
def list_members(db: Session = Depends(get_db)):
    return service.list(db)


@router.post("")
def invite_member(payload: MemberPayload, db: Session = Depends(get_db)):
    return service.invite(db, payload)


@router.delete("/{member_id}")
def remove_member(member_id: int, db: Session = Depends(get_db)):
    service.remove(db, member_id)
    return {"ok": True}
