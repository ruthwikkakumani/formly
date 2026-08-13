from datetime import datetime

from pydantic import BaseModel, Field

from app.core.constants import THEME_DEFAULTS
from app.schemas.question import QuestionPayload, QuestionRead


class ActorPayload(BaseModel):
    actor_name: str = ""
    actor_email: str = ""


class FormPayload(ActorPayload):
    title: str = "Untitled form"
    description: str = ""
    webhook_url: str = ""
    theme: dict = Field(default_factory=lambda: dict(THEME_DEFAULTS))
    questions: list[QuestionPayload] = Field(default_factory=list)


class RenamePayload(ActorPayload):
    title: str


class PresencePayload(ActorPayload):
    pass


class ActorActionPayload(ActorPayload):
    pass


class FormRead(BaseModel):
    id: int
    title: str
    description: str
    status: str
    slug: str
    webhook_url: str = ""
    theme: dict
    created_at: datetime
    response_count: int
    questions: list[QuestionRead]
