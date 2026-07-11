from pydantic import BaseModel, EmailStr, Field

from app.models.user import RoleEnum


class SignupRequest(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=255)
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    tenant_id: int
    email: str
    full_name: str
    role: RoleEnum

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut