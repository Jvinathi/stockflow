from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_roles
from app.core.security import hash_password
from app.database import get_db
from app.models.user import User, RoleEnum
from app.schemas.auth_schema import UserOut
from app.schemas.user_schema import CreateUserRequest, UserListItem

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me", response_model=UserOut)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("", response_model=List[UserListItem])
def list_users(
    current_user: User = Depends(require_roles(RoleEnum.OWNER, RoleEnum.MANAGER)),
    db: Session = Depends(get_db),
):
    users = db.query(User).filter(User.tenant_id == current_user.tenant_id).all()
    return users


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: CreateUserRequest,
    current_user: User = Depends(require_roles(RoleEnum.OWNER)),
    db: Session = Depends(get_db),
):
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    if payload.role == RoleEnum.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create another OWNER account. Only MANAGER or STAFF roles are allowed here.",
        )

    new_user = User(
        tenant_id=current_user.tenant_id,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: User = Depends(require_roles(RoleEnum.OWNER)),
    db: Session = Depends(get_db),
):
    user_to_delete = (
        db.query(User)
        .filter(User.id == user_id, User.tenant_id == current_user.tenant_id)
        .first()
    )

    if not user_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user_to_delete.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account",
        )

    if user_to_delete.role == RoleEnum.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete an OWNER account",
        )

    db.delete(user_to_delete)
    db.commit()
    return None