import csv
import io

from fastapi import APIRouter, Body, Depends, Response
from sqlalchemy.orm import Session

from app.api.deps import form_service, get_current_user, response_service
from app.db.session import get_db
from app.models import Member
from app.schemas.form import ActorActionPayload, FormPayload, PresencePayload, RenamePayload
from app.services.collaboration_service import CollaborationService

collab = CollaborationService()

router = APIRouter(prefix="/forms", tags=["forms"], dependencies=[Depends(get_current_user)])


@router.get("")
def list_forms(db: Session = Depends(get_db)):
    return [form_service.serialize(form) for form in form_service.repo.list(db)]


@router.post("")
def create_form(payload: FormPayload, db: Session = Depends(get_db), user: Member = Depends(get_current_user)):
    payload.actor_name = user.name
    payload.actor_email = user.email
    return form_service.serialize(form_service.create(db, payload))


@router.get("/{form_id}")
def get_form(form_id: int, db: Session = Depends(get_db)):
    return form_service.serialize(form_service.require(db, form_id))


@router.put("/{form_id}")
def update_form(form_id: int, payload: FormPayload, db: Session = Depends(get_db), user: Member = Depends(get_current_user)):
    payload.actor_name = user.name
    payload.actor_email = user.email
    return form_service.serialize(form_service.update(db, form_id, payload))


@router.patch("/{form_id}")
def rename_form(form_id: int, payload: RenamePayload, db: Session = Depends(get_db), user: Member = Depends(get_current_user)):
    return form_service.serialize(form_service.rename(db, form_id, payload.title, user.name, user.email))


@router.delete("/{form_id}")
def delete_form(form_id: int, db: Session = Depends(get_db)):
    form_service.delete(db, form_id)
    return {"ok": True}


@router.post("/{form_id}/duplicate")
def duplicate_form(form_id: int, db: Session = Depends(get_db)):
    return form_service.serialize(form_service.duplicate(db, form_id))


@router.post("/{form_id}/publish")
def toggle_publish(
    form_id: int,
    payload: ActorActionPayload = Body(default_factory=ActorActionPayload),
    db: Session = Depends(get_db),
    user: Member = Depends(get_current_user),
):
    return form_service.serialize(form_service.toggle_publish(db, form_id, user.name, user.email))


@router.post("/{form_id}/presence")
def heartbeat(form_id: int, payload: PresencePayload, db: Session = Depends(get_db), user: Member = Depends(get_current_user)):
    form_service.require(db, form_id)
    return collab.heartbeat(db, form_id, user.name, user.email)


@router.get("/{form_id}/presence")
def list_editors(form_id: int, db: Session = Depends(get_db)):
    form_service.require(db, form_id)
    return collab.active_editors(db, form_id)


@router.get("/{form_id}/activity")
def form_activity(form_id: int, db: Session = Depends(get_db)):
    form_service.require(db, form_id)
    return collab.history(db, form_id)


@router.get("/{form_id}/responses")
def list_responses(form_id: int, db: Session = Depends(get_db)):
    return response_service.list_responses(db, form_id)


@router.get("/{form_id}/stats")
def form_stats(form_id: int, db: Session = Depends(get_db)):
    return response_service.stats(db, form_id)


@router.get("/{form_id}/responses.csv")
def export_csv(form_id: int, db: Session = Depends(get_db)):
    form = form_service.require(db, form_id)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["submitted_at", *[question.title for question in form.questions]])
    for response in response_service.repo.list_for_form(db, form_id):
        answers = {answer.question_id: answer.value for answer in response.answers}
        writer.writerow(
            [response.submitted_at.isoformat(), *[answers.get(question.id, "") for question in form.questions]]
        )
    return Response(
        output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="form-{form_id}-responses.csv"'},
    )
