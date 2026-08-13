from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _invite_expiry() -> datetime:
    return datetime.utcnow() + timedelta(days=7)


class WorkspaceInvite(Base):
    __tablename__ = "workspace_invites"

    id: Mapped[int] = mapped_column(primary_key=True)
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True, default=lambda: uuid4().hex)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(180), index=True)
    role: Mapped[str] = mapped_column(String(20), default="editor")
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime, default=_invite_expiry)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
