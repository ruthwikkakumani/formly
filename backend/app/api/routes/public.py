from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import form_service, response_service
from app.db.session import get_db
from app.schemas.submission import PartialPayload, SubmissionPayload

router = APIRouter(prefix="/public", tags=["public forms"])


@router.get("/{slug}")
def get_public_form(slug: str, db: Session = Depends(get_db)):
    return form_service.serialize(form_service.require_public(db, slug))


@router.post("/{slug}/responses")
def submit_response(slug: str, payload: SubmissionPayload, db: Session = Depends(get_db)):
    return {"id": response_service.submit(db, slug, payload)}


@router.get("/{slug}/partial")
def get_partial(slug: str, visitor_id: str, db: Session = Depends(get_db)):
    return response_service.load_partial(db, slug, visitor_id)


@router.post("/{slug}/partial")
def save_partial(slug: str, payload: PartialPayload, db: Session = Depends(get_db)):
    response_service.save_partial(db, slug, payload)
    return {"ok": True}


@router.post("/{slug}/upload")
async def upload_file(
    slug: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    return await response_service.store_upload(db, slug, file)
