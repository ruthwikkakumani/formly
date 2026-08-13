from pydantic import BaseModel, Field, field_validator


class AnswerPayload(BaseModel):
    question_id: int
    value: str = ""


class SubmissionPayload(BaseModel):
    answers: list[AnswerPayload]
    visitor_id: str | None = None


class PartialPayload(BaseModel):
    visitor_id: str
    answers: dict[str, str] = Field(default_factory=dict)

    @field_validator("answers", mode="before")
    @classmethod
    def stringify_answers(cls, value: object) -> dict[str, str]:
        if not isinstance(value, dict):
            return {}
        return {str(key): "" if item is None else str(item) for key, item in value.items()}
