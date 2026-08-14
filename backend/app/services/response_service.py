from collections import Counter
from pathlib import Path
from uuid import uuid4
import csv
import io

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants import CHOICE_TYPES, MAX_UPLOAD_BYTES
from app.core.exceptions import AppError
from app.models import Answer, PartialResponse, Response
from app.repositories.form_repository import FormRepository
from app.repositories.response_repository import ResponseRepository
from app.schemas.submission import PartialPayload, SubmissionPayload
from app.services.form_service import FormService
from app.services.validation_service import reachable_questions, validate_answer
from app.services.webhook_service import dispatch_webhook


class ResponseService:
    def __init__(
        self,
        forms: FormService | None = None,
        repo: ResponseRepository | None = None,
        form_repo: FormRepository | None = None,
    ) -> None:
        self.forms = forms or FormService()
        self.repo = repo or ResponseRepository()
        self.form_repo = form_repo or FormRepository()

    def serialize_response(self, response: Response) -> dict:
        return {
            "id": response.id,
            "submitted_at": response.submitted_at,
            "answers": {answer.question_id: answer.value for answer in response.answers},
        }

    def require_form(self, db: Session, form_id: int):
        form = self.form_repo.get_core(db, form_id)
        if not form:
            raise AppError(404, "We couldn't find that form. It may have been removed.")
        return form

    def list_responses(self, db: Session, form_id: int) -> list[dict]:
        self.require_form(db, form_id)
        return [self.serialize_response(item) for item in self.repo.list_for_form(db, form_id)]

    def submit(self, db: Session, slug: str, payload: SubmissionPayload) -> int:
        form = self.forms.require_public(db, slug)
        incoming = {answer.question_id: answer.value.strip() for answer in payload.answers}
        for question in reachable_questions(form.questions, incoming):
            error = validate_answer(question, incoming.get(question.id, ""))
            if error:
                raise AppError(422, error)
        response = self.repo.add(db, Response(form_id=form.id))
        for question in form.questions:
            value = incoming.get(question.id, "")
            if value:
                self.repo.add_answer(db, Answer(response_id=response.id, question_id=question.id, value=value))
        self.repo.delete_partial(db, payload.visitor_id)
        db.commit()
        dispatch_webhook(
            form.webhook_url or "",
            {
                "event": "form_response",
                "form_id": form.id,
                "form_title": form.title,
                "response_id": response.id,
                "answers": incoming,
            },
        )
        return response.id

    def save_partial(self, db: Session, slug: str, payload: PartialPayload) -> None:
        form = self.forms.require_public(db, slug)
        partial = self.repo.get_partial(db, payload.visitor_id)
        if partial:
            if partial.form_id != form.id:
                raise AppError(404, "We couldn't find that form. It may have been removed.")
            partial.answers = payload.answers
        else:
            self.repo.add_partial(
                db,
                PartialResponse(
                    form_id=form.id,
                    visitor_id=payload.visitor_id,
                    answers=payload.answers,
                ),
            )
        db.commit()

    def load_partial(self, db: Session, slug: str, visitor_id: str) -> dict:
        form = self.forms.require_public(db, slug)
        partial = self.repo.get_partial(db, visitor_id)
        if not partial or partial.form_id != form.id:
            return {"answers": {}}
        raw = partial.answers or {}
        return {"answers": {str(key): "" if value is None else str(value) for key, value in raw.items()}}

    def _stats_from(self, form, responses: list[Response], in_progress: int) -> dict:
        values_by_question: dict[int, list[str]] = {}
        for response in responses:
            for answer in response.answers:
                values_by_question.setdefault(answer.question_id, []).append(answer.value)
        summaries = []
        for question in form.questions:
            values = values_by_question.get(question.id, [])
            summaries.append(
                {
                    "question_id": question.id,
                    "title": question.title,
                    "type": question.type,
                    "responses": len(values),
                    "counts": dict(Counter(values)) if question.type in CHOICE_TYPES else {},
                }
            )
        completed = len(responses)
        total = completed + in_progress
        return {
            "questions": summaries,
            "completion": {
                "completed": completed,
                "in_progress": in_progress,
                "rate": round(completed / total * 100) if total else 0,
            },
        }

    def stats(self, db: Session, form_id: int) -> dict:
        form = self.require_form(db, form_id)
        responses = self.repo.list_for_form(db, form_id)
        return self._stats_from(form, responses, self.repo.count_partials(db, form_id))

    def results(self, db: Session, form_id: int) -> dict:
        form = self.require_form(db, form_id)
        responses = self.repo.list_for_form(db, form_id)
        return {
            "responses": [self.serialize_response(item) for item in responses],
            "stats": self._stats_from(form, responses, self.repo.count_partials(db, form_id)),
        }

    def export_csv(self, db: Session, form_id: int) -> tuple[str, str]:
        form = self.require_form(db, form_id)
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["submitted_at", *[question.title for question in form.questions]])
        for response in self.repo.list_for_form(db, form_id):
            answers = {answer.question_id: answer.value for answer in response.answers}
            writer.writerow(
                [response.submitted_at.isoformat(), *[answers.get(question.id, "") for question in form.questions]]
            )
        return output.getvalue(), f"form-{form_id}-responses.csv"

    async def store_upload(self, db: Session, slug: str, file: UploadFile) -> dict:
        self.forms.require_public(db, slug)
        data = await file.read()
        if len(data) > MAX_UPLOAD_BYTES:
            raise AppError(413, "File must be 10MB or smaller")
        settings.upload_dir.mkdir(exist_ok=True)
        safe_name = Path(file.filename or "upload").name
        stored_name = f"{uuid4().hex}-{safe_name}"
        (settings.upload_dir / stored_name).write_bytes(data)
        return {"url": f"/uploads/{stored_name}", "name": safe_name}
