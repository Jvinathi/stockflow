from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, create_access_token
from app.database import get_db
from app.models.tenant import Tenant
from app.models.user import User, RoleEnum
from app.schemas.auth_schema import SignupRequest, LoginRequest, TokenResponse, UserOut

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    # Check email isn't already used across the whole platform
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    # Step 1: create the new Tenant (the business/organization)
    new_tenant = Tenant(name=payload.company_name)
    db.add(new_tenant)
    db.flush()  # assigns new_tenant.id without committing yet

    # Step 2: create the first user for this tenant, always as OWNER
    new_user = User(
        tenant_id=new_tenant.id,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=RoleEnum.OWNER,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(
        data={"user_id": new_user.id, "tenant_id": new_user.tenant_id, "role": new_user.role.value}
    )

    return TokenResponse(access_token=access_token, user=UserOut.model_validate(new_user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token = create_access_token(
        data={"user_id": user.id, "tenant_id": user.tenant_id, "role": user.role.value}
    )

    return TokenResponse(access_token=access_token, user=UserOut.model_validate(user))