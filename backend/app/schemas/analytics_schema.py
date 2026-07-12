from datetime import date
from typing import List

from pydantic import BaseModel


class TopProductItem(BaseModel):
    product_id: int
    product_name: str
    total_quantity_sold: int
    total_revenue: float


class RevenuePoint(BaseModel):
    date: date
    revenue: float
    order_count: int


class AnalyticsSummary(BaseModel):
    total_revenue: float
    total_orders: int
    total_products: int
    low_stock_count: int
    top_products: List[TopProductItem]
    revenue_trend: List[RevenuePoint]