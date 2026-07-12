import logging

from apscheduler.schedulers.background import BackgroundScheduler

from app.database import SessionLocal
from app.models.product import Product
from app.models.notification import Notification, NotificationTypeEnum

logger = logging.getLogger("stockflow.scheduler")


def check_low_stock_job():
    """
    Scans ALL products across ALL tenants, and creates a LOW_STOCK notification
    for any product at or below its reorder_threshold -- but only if an unread
    LOW_STOCK notification for that exact product doesn't already exist.
    This prevents spamming the same alert every time the job runs.
    """
    db = SessionLocal()
    try:
        low_stock_products = (
            db.query(Product)
            .filter(Product.stock_quantity <= Product.reorder_threshold)
            .all()
        )

        created_count = 0
        for product in low_stock_products:
            existing_unread = (
                db.query(Notification)
                .filter(
                    Notification.product_id == product.id,
                    Notification.type == NotificationTypeEnum.LOW_STOCK,
                    Notification.is_read == False,  # noqa: E712
                )
                .first()
            )
            if existing_unread:
                continue  # already alerted, don't spam another one

            notification = Notification(
                tenant_id=product.tenant_id,
                product_id=product.id,
                message=(
                    f"Low stock alert: '{product.name}' has {product.stock_quantity} units left "
                    f"(reorder threshold: {product.reorder_threshold})"
                ),
                type=NotificationTypeEnum.LOW_STOCK,
                is_read=False,
            )
            db.add(notification)
            created_count += 1

        db.commit()
        logger.info(f"Low-stock check complete. Created {created_count} new notification(s).")
    except Exception as e:
        db.rollback()
        logger.error(f"Low-stock check failed: {e}")
    finally:
        db.close()


scheduler = BackgroundScheduler()


def start_scheduler():
    # Runs every 1 hour. For faster testing during development, you can temporarily
    # change this to minutes=1 (see Step 9.7 below), then change it back afterward.
    scheduler.add_job(check_low_stock_job, "interval", hours=1, id="low_stock_check")
    scheduler.start()
    logger.info("Scheduler started: low-stock check will run every 1 hour.")