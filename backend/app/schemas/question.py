from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.constants import QUESTION_TYPES


class QuestionPayload(BaseModel):
    id: int | None = None
    type: str = "short_text"
    title: str = "Your question here"
    description: str = ""
    required: bool = False
    options: list[str] = Field(default_factory=list)
    logic: dict = Field(default_factory=dict)

    @field_validator("type")
    @classmethod
    def validate_type(cls, value: str) -> str:
        if value not in QUESTION_TYPES:
            raise ValueError(f"Unsupported question type: {value}")
        return value


class QuestionRead(QuestionPayload):
    id: int
    position: int
    model_config = ConfigDict(from_attributes=True)
