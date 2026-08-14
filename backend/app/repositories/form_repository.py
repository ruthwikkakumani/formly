from sqlalchemy.orm import Session, joinedload

from app.core.constants import FORM_STATUS_PUBLISHED
from app.models import Form, Question


class FormRepository:
    def get(self, db: Session, form_id: int) -> Form | None:
        return (
            db.query(Form)
            .options(joinedload(Form.questions), joinedload(Form.responses))
            .filter(Form.id == form_id)
            .first()
        )

    def get_core(self, db: Session, form_id: int) -> Form | None:
        return db.query(Form).options(joinedload(Form.questions)).filter(Form.id == form_id).first()

    def get_by_slug(self, db: Session, slug: str) -> Form | None:
        return (
            db.query(Form)
            .options(joinedload(Form.questions), joinedload(Form.responses))
            .filter(Form.slug == slug)
            .first()
        )

    def get_public(self, db: Session, slug: str) -> Form | None:
        return (
            db.query(Form)
            .options(joinedload(Form.questions), joinedload(Form.responses))
            .filter(Form.slug == slug, Form.status == FORM_STATUS_PUBLISHED)
            .first()
        )

    def list(self, db: Session) -> list[Form]:
        return (
            db.query(Form)
            .options(joinedload(Form.questions), joinedload(Form.responses))
            .order_by(Form.updated_at.desc())
            .all()
        )

    def has_any(self, db: Session) -> bool:
        return db.query(Form.id).first() is not None

    def add(self, db: Session, form: Form) -> Form:
        db.add(form)
        db.flush()
        return form

    def delete(self, db: Session, form: Form) -> None:
        db.delete(form)

    def add_question(self, db: Session, question: Question) -> None:
        db.add(question)

    def delete_question(self, db: Session, question: Question) -> None:
        db.delete(question)
