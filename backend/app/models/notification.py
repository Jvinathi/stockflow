import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship

from app.database import Base


class NotificationTypeEnum(str, enum.Enum):
    LOW_STOCK = "LOW_STOCK"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)

    message = Column(String(500), nullable=False)
    type = Column(Enum(NotificationTypeEnum), nullable=False, default=NotificationTypeEnum.LOW_STOCK)
    is_read = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="notifications")