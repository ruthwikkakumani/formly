from sqlalchemy.orm import Session, joinedload

from app.models import PartialResponse, Response


class ResponseRepository:
    def list_for_form(self, db: Session, form_id: int) -> list[Response]:
        return (
            db.query(Response)
            .options(joinedload(Response.answers))
            .filter(Response.form_id == form_id)
            .order_by(Response.submitted_at.desc())
            .all()
        )

    def get_partial(self, db: Session, visitor_id: str) -> PartialResponse | None:
        return db.query(PartialResponse).filter(PartialResponse.visitor_id == visitor_id).first()

    def count_partials(self, db: Session, form_id: int) -> int:
        return db.query(PartialResponse).filter(PartialResponse.form_id == form_id).count()

    def delete_partial(self, db: Session, visitor_id: str | None) -> None:
        if not visitor_id:
            return
        db.query(PartialResponse).filter(PartialResponse.visitor_id == visitor_id).delete()
