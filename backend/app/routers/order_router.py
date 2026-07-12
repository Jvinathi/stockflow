from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user
from app.database import get_db
from app.models.order import Order, OrderItem, OrderStatusEnum
from app.models.product import Product
from app.models.user import User
from app.schemas.order_schema import OrderCreate, OrderOut, OrderItemOut, OrderListItem

router = APIRouter(prefix="/api/orders", tags=["Orders"])


@router.get("", response_model=List[OrderListItem])
def list_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(Order)
        .filter(Order.tenant_id == current_user.tenant_id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return orders


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
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

    return _build_order_out(order)


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Any logged-in role (OWNER, MANAGER, STAFF) can create an order —
    # this is the day-to-day "make a sale" action every employee needs.

    # Step 1: Fetch all requested products in ONE query, scoped to this tenant.
    product_ids = [item.product_id for item in payload.items]
    products = (
        db.query(Product)
        .filter(Product.id.in_(product_ids), Product.tenant_id == current_user.tenant_id)
        .all()
    )
    products_by_id = {p.id: p for p in products}

    # Step 2: Validate every product exists (belongs to this tenant) and has enough stock.
    # We validate ALL items BEFORE making any changes -- this way, if item #3 of 5
    # fails, we haven't already decremented stock for items #1 and #2.
    for item in payload.items:
        product = products_by_id.get(item.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {item.product_id} not found",
            )
        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for '{product.name}': "
                    f"requested {item.quantity}, available {product.stock_quantity}"
                ),
            )

    # Step 3: All validations passed -- now build the Order + OrderItems + decrement stock.
    # Everything below happens in a single DB transaction: either it all commits,
    # or (if anything raises an exception) none of it is saved.
    try:
        new_order = Order(
            tenant_id=current_user.tenant_id,
            created_by=current_user.id,
            customer_name=payload.customer_name,
            total_amount=0.0,
            status=OrderStatusEnum.COMPLETED,
        )
        db.add(new_order)
        db.flush()  # assigns new_order.id without committing

        total_amount = 0.0
        for item in payload.items:
            product = products_by_id[item.product_id]
            subtotal = product.price * item.quantity

            order_item = OrderItem(
                order_id=new_order.id,
                product_id=product.id,
                quantity=item.quantity,
                unit_price=product.price,
                subtotal=subtotal,
            )
            db.add(order_item)

            product.stock_quantity -= item.quantity
            total_amount += subtotal

        new_order.total_amount = total_amount

        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create order, no changes were saved",
        )

    db.refresh(new_order)
    order_with_items = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == new_order.id)
        .first()
    )
    return _build_order_out(order_with_items)


def _build_order_out(order: Order) -> OrderOut:
    """Helper to manually attach product_name onto each OrderItem for the response."""
    item_outs = [
        OrderItemOut(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product.name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.subtotal,
        )
        for item in order.items
    ]
    return OrderOut(
        id=order.id,
        customer_name=order.customer_name,
        total_amount=order.total_amount,
        status=order.status,
        created_at=order.created_at,
        created_by=order.created_by,
        items=item_outs,
    )