from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class QuestionPayload(BaseModel):
    type: str = "short_text"
    title: str = "Your question here"
    description: str = ""
    required: bool = False
    options: list[str] = Field(default_factory=list)
    logic: dict = Field(default_factory=dict)


class FormPayload(BaseModel):
    title: str = "Untitled form"
    description: str = ""
    theme: dict = Field(default_factory=lambda: {"color": "#262627", "background": "#f7f7f4"})
    questions: list[QuestionPayload] = Field(default_factory=list)


class AnswerPayload(BaseModel):
    question_id: int
    value: str = ""


class SubmissionPayload(BaseModel):
    answers: list[AnswerPayload]
    visitor_id: str | None = None


class PartialPayload(BaseModel):
    visitor_id: str
    answers: dict[str, str]


class QuestionRead(QuestionPayload):
    id: int
    position: int
    model_config = ConfigDict(from_attributes=True)


class FormRead(BaseModel):
    id: int
    title: str
    description: str
    status: str
    slug: str
    theme: dict
    created_at: datetime
    response_count: int
    questions: list[QuestionRead]
