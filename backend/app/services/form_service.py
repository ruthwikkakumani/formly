from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Form, Question
from app.repositories.form_repository import FormRepository
from app.schemas.form import FormPayload
from app.schemas.question import QuestionPayload


class FormService:
    def __init__(self) -> None:
        self.repo = FormRepository()

    def serialize(self, form: Form) -> dict:
        return {
            "id": form.id,
            "title": form.title,
            "description": form.description,
            "status": form.status,
            "slug": form.slug,
            "webhook_url": form.webhook_url or "",
            "theme": form.theme or {},
            "created_at": form.created_at,
            "updated_at": form.updated_at,
            "response_count": len(form.responses),
            "questions": [
                {
                    "id": question.id,
                    "position": question.position,
                    "type": question.type,
                    "title": question.title,
                    "description": question.description,
                    "required": question.required,
                    "options": question.options or [],
                    "logic": question.logic or {},
                }
                for question in form.questions
            ],
        }

    def require(self, db: Session, form_id: int) -> Form:
        form = self.repo.get(db, form_id)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")
        return form

    def require_public(self, db: Session, slug: str) -> Form:
        form = self.repo.get_public(db, slug)
        if not form:
            raise HTTPException(status_code=404, detail="This form is not available")
        return form

    def create(self, db: Session, payload: FormPayload) -> Form:
        form = Form(
            title=payload.title.strip() or "Untitled form",
            description=payload.description,
            webhook_url=payload.webhook_url,
            theme=payload.theme,
            slug=uuid4().hex[:10],
        )
        db.add(form)
        db.flush()
        self._sync_questions(db, form, payload)
        db.commit()
        return self.require(db, form.id)

    def update(self, db: Session, form_id: int, payload: FormPayload) -> Form:
        form = self.require(db, form_id)
        form.title = payload.title.strip() or form.title
        form.description = payload.description
        form.webhook_url = payload.webhook_url
        form.theme = payload.theme
        self._sync_questions(db, form, payload)
        db.commit()
        return self.require(db, form_id)

    def rename(self, db: Session, form_id: int, title: str) -> Form:
        form = self.require(db, form_id)
        form.title = title.strip() or form.title
        db.commit()
        return self.require(db, form_id)

    def duplicate(self, db: Session, form_id: int) -> Form:
        source = self.require(db, form_id)
        copy = Form(
            title=f"{source.title} (copy)",
            description=source.description,
            theme=source.theme,
            status="draft",
            slug=uuid4().hex[:10],
        )
        db.add(copy)
        db.flush()
        for question in source.questions:
            db.add(
                Question(
                    form_id=copy.id,
                    position=question.position,
                    type=question.type,
                    title=question.title,
                    description=question.description,
                    required=question.required,
                    options=question.options,
                    logic=question.logic,
                )
            )
        db.commit()
        return self.require(db, copy.id)

    def toggle_publish(self, db: Session, form_id: int) -> Form:
        form = self.require(db, form_id)
        form.status = "draft" if form.status == "published" else "published"
        db.commit()
        return self.require(db, form_id)

    def delete(self, db: Session, form_id: int) -> None:
        form = self.require(db, form_id)
        db.delete(form)
        db.commit()

    def _sync_questions(self, db: Session, form: Form, payload: FormPayload) -> None:
        existing = {question.id: question for question in form.questions}
        kept: set[int] = set()
        incoming = payload.questions or [QuestionPayload()]
        for position, item in enumerate(incoming):
            data = item.model_dump(exclude={"id"})
            if item.id and item.id in existing:
                question = existing[item.id]
                for field, value in data.items():
                    setattr(question, field, value)
                question.position = position
                kept.add(item.id)
            else:
                db.add(Question(form_id=form.id, position=position, **data))
        for question_id, question in existing.items():
            if question_id not in kept:
                db.delete(question)
