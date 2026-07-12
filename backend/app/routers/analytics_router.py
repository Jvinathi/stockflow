from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_roles
from app.database import get_db
from app.models.user import User, RoleEnum
from app.schemas.analytics_schema import AnalyticsSummary
from app.services.analytics_service import get_analytics_summary

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
def analytics_summary(
    days: int = Query(30, ge=1, le=365, description="Number of days for the revenue trend"),
    current_user: User = Depends(require_roles(RoleEnum.OWNER, RoleEnum.MANAGER)),
    db: Session = Depends(get_db),
):
    data = get_analytics_summary(db, tenant_id=current_user.tenant_id, days=days)
    return data