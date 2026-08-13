import re

from pydantic import BaseModel, Field, field_validator

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class MemberPayload(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str
    role: str = "editor"

    @field_validator("name")
    @classmethod
    def require_name(cls, value: str) -> str:
        name = value.strip()
        if not name:
            raise ValueError("Enter a name.")
        return name

    @field_validator("email")
    @classmethod
    def require_email(cls, value: str) -> str:
        email = str(value).strip().lower()
        if not EMAIL_PATTERN.match(email):
            raise ValueError("Enter a valid email address.")
        return email


class RoleUpdatePayload(BaseModel):
    role: str

    @field_validator("role")
    @classmethod
    def require_assignable_role(cls, value: str) -> str:
        role = value.strip().lower()
        if role not in {"editor", "viewer"}:
            raise ValueError("Role must be editor or viewer.")
        return role


class MemberRead(BaseModel):
    id: int
    name: str
    email: str
    role: str
