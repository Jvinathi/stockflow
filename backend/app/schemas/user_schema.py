from pydantic import BaseModel, EmailStr, Field

from app.models.user import RoleEnum


class CreateUserRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: RoleEnum = RoleEnum.STAFF


class UserListItem(BaseModel):
    id: int
    email: str
    full_name: str
    role: RoleEnum

    class Config:
        from_attributes = True