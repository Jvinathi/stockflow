from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.order import Order, OrderItem, OrderStatusEnum
from app.models.product import Product


def get_analytics_summary(db: Session, tenant_id: int, days: int = 30):
    total_revenue = (
        db.query(func.coalesce(func.sum(Order.total_amount), 0.0))
        .filter(Order.tenant_id == tenant_id, Order.status == OrderStatusEnum.COMPLETED)
        .scalar()
    )

    total_orders = (
        db.query(func.count(Order.id))
        .filter(Order.tenant_id == tenant_id, Order.status == OrderStatusEnum.COMPLETED)
        .scalar()
    )

    total_products = (
        db.query(func.count(Product.id))
        .filter(Product.tenant_id == tenant_id)
        .scalar()
    )

    low_stock_count = (
        db.query(func.count(Product.id))
        .filter(
            Product.tenant_id == tenant_id,
            Product.stock_quantity <= Product.reorder_threshold,
        )
        .scalar()
    )

    top_products_rows = (
        db.query(
            Product.id.label("product_id"),
            Product.name.label("product_name"),
            func.coalesce(func.sum(OrderItem.quantity), 0).label("total_quantity_sold"),
            func.coalesce(func.sum(OrderItem.subtotal), 0.0).label("total_revenue"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.tenant_id == tenant_id, Order.status == OrderStatusEnum.COMPLETED)
        .group_by(Product.id, Product.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
        .all()
    )

    cutoff_date = datetime.utcnow() - timedelta(days=days)
    revenue_rows = (
        db.query(
            func.date(Order.created_at).label("order_date"),
            func.coalesce(func.sum(Order.total_amount), 0.0).label("revenue"),
            func.count(Order.id).label("order_count"),
        )
        .filter(
            Order.tenant_id == tenant_id,
            Order.status == OrderStatusEnum.COMPLETED,
            Order.created_at >= cutoff_date,
        )
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at).asc())
        .all()
    )

    return {
        "total_revenue": float(total_revenue),
        "total_orders": int(total_orders),
        "total_products": int(total_products),
        "low_stock_count": int(low_stock_count),
        "top_products": [
            {
                "product_id": row.product_id,
                "product_name": row.product_name,
                "total_quantity_sold": int(row.total_quantity_sold),
                "total_revenue": float(row.total_revenue),
            }
            for row in top_products_rows
        ],
        "revenue_trend": [
            {
                "date": row.order_date,
                "revenue": float(row.revenue),
                "order_count": int(row.order_count),
            }
            for row in revenue_rows
        ],
    }