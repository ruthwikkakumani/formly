import csv
import io
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.forms import FormService
from app.schemas.forms import FormPayload

router = APIRouter(prefix="/forms", tags=["forms"])
service = FormService()

@router.get("")
def list_forms(db: Session = Depends(get_db)): return [service.serialize(form) for form in service.repo.list(db)]
@router.post("")
def create_form(payload: FormPayload, db: Session = Depends(get_db)): return service.serialize(service.create(db, payload))
@router.get("/{form_id}")
def get_form(form_id: int, db: Session = Depends(get_db)): return service.serialize(service.require(db, form_id))
@router.put("/{form_id}")
def update_form(form_id: int, payload: FormPayload, db: Session = Depends(get_db)): return service.serialize(service.update(db, form_id, payload))
@router.delete("/{form_id}")
def delete_form(form_id: int, db: Session = Depends(get_db)):
    db.delete(service.require(db, form_id)); db.commit(); return {"ok": True}
@router.post("/{form_id}/duplicate")
def duplicate_form(form_id: int, db: Session = Depends(get_db)): return service.serialize(service.duplicate(db, form_id))
@router.post("/{form_id}/publish")
def toggle_publish(form_id: int, db: Session = Depends(get_db)):
    form=service.require(db, form_id); form.status="draft" if form.status == "published" else "published"; db.commit(); return service.serialize(form)
@router.get("/{form_id}/responses")
def responses(form_id: int, db: Session = Depends(get_db)):
    service.require(db, form_id); return [{"id": r.id, "submitted_at": r.submitted_at, "answers": {a.question_id:a.value for a in r.answers}} for r in service.repo.responses(db, form_id)]
@router.get("/{form_id}/stats")
def stats(form_id: int, db: Session = Depends(get_db)): return service.stats(db, form_id)
@router.get("/{form_id}/responses.csv")
def export_csv(form_id: int, db: Session = Depends(get_db)):
    form=service.require(db, form_id); output=io.StringIO(); writer=csv.writer(output); writer.writerow(["submitted_at",*[q.title for q in form.questions]])
    for response in service.repo.responses(db, form_id):
        answers={answer.question_id:answer.value for answer in response.answers}; writer.writerow([response.submitted_at.isoformat(),*[answers.get(q.id, "") for q in form.questions]])
    return Response(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="form-{form_id}-responses.csv"'})
