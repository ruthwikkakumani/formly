from sqlalchemy.orm import Session, joinedload
from app.models import Form, Response


class FormRepository:
    def get(self, db: Session, form_id: int) -> Form | None:
        return db.query(Form).options(joinedload(Form.questions), joinedload(Form.responses)).filter(Form.id == form_id).first()

    def get_public(self, db: Session, slug: str) -> Form | None:
        return db.query(Form).options(joinedload(Form.questions), joinedload(Form.responses)).filter(Form.slug == slug, Form.status == "published").first()

    def list(self, db: Session) -> list[Form]:
        return db.query(Form).options(joinedload(Form.questions), joinedload(Form.responses)).order_by(Form.updated_at.desc()).all()

    def responses(self, db: Session, form_id: int) -> list[Response]:
        return db.query(Response).options(joinedload(Response.answers)).filter(Response.form_id == form_id).order_by(Response.submitted_at.desc()).all()
