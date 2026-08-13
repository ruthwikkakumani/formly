from sqlalchemy.orm import Session, joinedload

from app.models import Form


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
            .filter(Form.slug == slug, Form.status == "published")
            .first()
        )

    def list(self, db: Session) -> list[Form]:
        return (
            db.query(Form)
            .options(joinedload(Form.questions), joinedload(Form.responses))
            .order_by(Form.updated_at.desc())
            .all()
        )
