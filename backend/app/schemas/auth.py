from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterPayload(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=120)


class LoginPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=120)


class AcceptInvitePayload(BaseModel):
    password: str = Field(min_length=8, max_length=120)


class ForgotPasswordPayload(BaseModel):
    email: EmailStr


class ResetPasswordPayload(BaseModel):
    password: str = Field(min_length=8, max_length=120)


class ProfileUpdatePayload(BaseModel):
    name: str = Field(min_length=1, max_length=120)

    @field_validator("name")
    @classmethod
    def require_name(cls, value: str) -> str:
        name = value.strip()
        if not name:
            raise ValueError("Enter a name.")
        return name


class ChangePasswordPayload(BaseModel):
    current_password: str = Field(min_length=1, max_length=120)
    new_password: str = Field(min_length=8, max_length=120)
