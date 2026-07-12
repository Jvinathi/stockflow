from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.notification import NotificationTypeEnum


class NotificationOut(BaseModel):
    id: int
    product_id: Optional[int]
    message: str
    type: NotificationTypeEnum
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True