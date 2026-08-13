from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models import PartialResponse
from app.schemas.forms import PartialPayload, SubmissionPayload
from app.services.forms import FormService

router = APIRouter(prefix="/public", tags=["public forms"])
service = FormService()

@router.get("/{slug}")
def get_public_form(slug: str, db: Session = Depends(get_db)): return service.serialize(service.require_public(db, slug))
@router.post("/{slug}/responses")
def submit_response(slug: str, payload: SubmissionPayload, db: Session = Depends(get_db)): return {"id": service.submit(db, slug, payload)}
@router.post("/{slug}/partial")
def save_partial(slug: str, payload: PartialPayload, db: Session = Depends(get_db)):
    form=service.require_public(db, slug); partial=db.query(PartialResponse).filter(PartialResponse.visitor_id == payload.visitor_id).first()
    if partial: partial.answers = payload.answers
    else: db.add(PartialResponse(form_id=form.id, visitor_id=payload.visitor_id, answers=payload.answers))
    db.commit(); return {"ok": True}
@router.post("/{slug}/upload")
async def upload_file(slug: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    service.require_public(db, slug); safe_name=Path(file.filename or "upload").name; stored_name=f"{uuid4().hex}-{safe_name}"; (settings.upload_dir / stored_name).write_bytes(await file.read()); return {"url": f"/uploads/{stored_name}", "name": safe_name}
