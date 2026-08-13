from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import THEME_DEFAULTS
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.partial_response import PartialResponse
    from app.models.question import Question
    from app.models.response import Response


class Form(Base):
    __tablename__ = "forms"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(180), default="Untitled form")
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="draft")
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    webhook_url: Mapped[str] = mapped_column(String(500), default="")
    theme: Mapped[dict] = mapped_column(JSON, default=lambda: dict(THEME_DEFAULTS))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    questions: Mapped[list["Question"]] = relationship(
        back_populates="form",
        cascade="all, delete-orphan",
        order_by="Question.position",
    )
    responses: Mapped[list["Response"]] = relationship(
        back_populates="form",
        cascade="all, delete-orphan",
    )
    partial_responses: Mapped[list["PartialResponse"]] = relationship(
        back_populates="form",
        cascade="all, delete-orphan",
    )
