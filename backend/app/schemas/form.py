from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

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
    updated_by: str = ""
    updated_by_email: str = ""
    theme: dict
    created_at: datetime
    updated_at: datetime | None = None
    response_count: int
    questions: list[QuestionRead]
    model_config = ConfigDict(from_attributes=True)


class PresenceRead(BaseModel):
    name: str
    email: str
    last_seen: datetime
    model_config = ConfigDict(from_attributes=True)


class ActivityRead(BaseModel):
    id: int
    actor_name: str
    actor_email: str
    action: str
    detail: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
