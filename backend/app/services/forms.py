from collections import Counter
from uuid import uuid4
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import Answer, Form, PartialResponse, Question, Response
from app.repositories.forms import FormRepository
from app.schemas.forms import FormPayload, SubmissionPayload


class FormService:
    def __init__(self): self.repo = FormRepository()

    def serialize(self, form: Form) -> dict:
        return {"id": form.id, "title": form.title, "description": form.description, "status": form.status, "slug": form.slug, "theme": form.theme, "created_at": form.created_at, "response_count": len(form.responses), "questions": [{"id": q.id, "position": q.position, "type": q.type, "title": q.title, "description": q.description, "required": q.required, "options": q.options, "logic": q.logic} for q in form.questions]}

    def require(self, db: Session, form_id: int) -> Form:
        form = self.repo.get(db, form_id)
        if not form: raise HTTPException(404, "Form not found")
        return form

    def require_public(self, db: Session, slug: str) -> Form:
        form = self.repo.get_public(db, slug)
        if not form: raise HTTPException(404, "This form is not available")
        return form

    def create(self, db: Session, payload: FormPayload) -> Form:
        form = Form(title=payload.title, description=payload.description, theme=payload.theme, slug=uuid4().hex[:10]); db.add(form); db.flush(); self._replace_questions(db, form.id, payload); db.commit(); return self.require(db, form.id)

    def update(self, db: Session, form_id: int, payload: FormPayload) -> Form:
        form = self.require(db, form_id); form.title, form.description, form.theme = payload.title, payload.description, payload.theme; db.query(Question).filter(Question.form_id == form_id).delete(); self._replace_questions(db, form_id, payload); db.commit(); return self.require(db, form_id)

    def _replace_questions(self, db: Session, form_id: int, payload: FormPayload):
        for position, question in enumerate(payload.questions): db.add(Question(form_id=form_id, position=position, **question.model_dump()))

    def duplicate(self, db: Session, form_id: int) -> Form:
        source = self.require(db, form_id); copy = Form(title=f"{source.title} (copy)", description=source.description, theme=source.theme, slug=uuid4().hex[:10]); db.add(copy); db.flush()
        for q in source.questions: db.add(Question(form_id=copy.id, position=q.position, type=q.type, title=q.title, description=q.description, required=q.required, options=q.options, logic=q.logic))
        db.commit(); return self.require(db, copy.id)

    def submit(self, db: Session, slug: str, payload: SubmissionPayload) -> int:
        form = self.require_public(db, slug); incoming = {answer.question_id: answer.value.strip() for answer in payload.answers}
        for question in form.questions:
            value = incoming.get(question.id, "")
            if question.required and not value: raise HTTPException(422, f"{question.title} is required")
            if value and question.type == "email" and "@" not in value: raise HTTPException(422, "Please enter a valid email")
            if value and question.type == "number":
                try: float(value)
                except ValueError: raise HTTPException(422, "Please enter a number")
        response = Response(form_id=form.id); db.add(response); db.flush()
        for question in form.questions:
            if incoming.get(question.id): db.add(Answer(response_id=response.id, question_id=question.id, value=incoming[question.id]))
        if payload.visitor_id: db.query(PartialResponse).filter(PartialResponse.visitor_id == payload.visitor_id).delete()
        db.commit(); return response.id

    def stats(self, db: Session, form_id: int) -> dict:
        form = self.require(db, form_id); summaries=[]
        for question in form.questions:
            values=[answer.value for answer in db.query(Answer).filter(Answer.question_id == question.id).all()]
            summaries.append({"question_id": question.id, "title": question.title, "responses": len(values), "counts": dict(Counter(values)) if question.type in {"multiple_choice","dropdown","yes_no","rating"} else {}})
        completed=len(form.responses); partials=db.query(PartialResponse).filter(PartialResponse.form_id == form_id).count(); total=completed+partials
        return {"questions": summaries, "completion": {"completed": completed, "in_progress": partials, "rate": round(completed / total * 100) if total else 0}}
