from pydantic import BaseModel, Field


class AnswerPayload(BaseModel):
    question_id: int
    value: str = ""


class SubmissionPayload(BaseModel):
    answers: list[AnswerPayload]
    visitor_id: str | None = None


class PartialPayload(BaseModel):
    visitor_id: str
    answers: dict[str, str] = Field(default_factory=dict)
