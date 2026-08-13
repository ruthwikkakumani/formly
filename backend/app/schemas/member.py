from pydantic import BaseModel, EmailStr, Field


class MemberPayload(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    role: str = "editor"


class MemberRead(BaseModel):
    id: int
    name: str
    email: str
    role: str
