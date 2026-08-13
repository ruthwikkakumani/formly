from pydantic import BaseModel, EmailStr, Field


class RegisterPayload(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=120)


class LoginPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=120)


class AcceptInvitePayload(BaseModel):
    password: str = Field(min_length=8, max_length=120)
