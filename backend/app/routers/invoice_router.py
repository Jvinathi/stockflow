from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user
from app.database import get_db
from app.models.order import Order, OrderItem
from app.models.user import User
from app.services.invoice_service import generate_invoice_pdf

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])


@router.get("/{order_id}")
def download_invoice(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id, Order.tenant_id == current_user.tenant_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    company_name = current_user.tenant.name

    pdf_bytes = generate_invoice_pdf(order, company_name)

    filename = f"invoice_order_{order.id}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )