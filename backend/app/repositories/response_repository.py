from sqlalchemy.orm import Session, joinedload

from app.models import Answer, PartialResponse, Response


class ResponseRepository:
    def list_for_form(self, db: Session, form_id: int) -> list[Response]:
        return (
            db.query(Response)
            .options(joinedload(Response.answers))
            .filter(Response.form_id == form_id)
            .order_by(Response.submitted_at.desc())
            .all()
        )

    def add(self, db: Session, response: Response) -> Response:
        db.add(response)
        db.flush()
        return response

    def add_answer(self, db: Session, answer: Answer) -> None:
        db.add(answer)

    def get_partial(self, db: Session, visitor_id: str) -> PartialResponse | None:
        return db.query(PartialResponse).filter(PartialResponse.visitor_id == visitor_id).first()

    def add_partial(self, db: Session, partial: PartialResponse) -> None:
        db.add(partial)

    def count_partials(self, db: Session, form_id: int) -> int:
        return db.query(PartialResponse).filter(PartialResponse.form_id == form_id).count()

    def delete_partial(self, db: Session, visitor_id: str | None) -> None:
        if not visitor_id:
            return
        db.query(PartialResponse).filter(PartialResponse.visitor_id == visitor_id).delete()
