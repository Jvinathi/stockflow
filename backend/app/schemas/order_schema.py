from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.order import OrderStatusEnum


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)


class OrderCreate(BaseModel):
    customer_name: Optional[str] = Field(None, max_length=255)
    items: List[OrderItemCreate] = Field(..., min_length=1)


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: float
    subtotal: float

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    customer_name: Optional[str]
    total_amount: float
    status: OrderStatusEnum
    created_at: datetime
    created_by: int
    items: List[OrderItemOut]

    class Config:
        from_attributes = True


class OrderListItem(BaseModel):
    id: int
    customer_name: Optional[str]
    total_amount: float
    status: OrderStatusEnum
    created_at: datetime

    class Config:
        from_attributes = True