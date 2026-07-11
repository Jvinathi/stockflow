from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_roles
from app.database import get_db
from app.models.product import Product
from app.models.user import User, RoleEnum
from app.schemas.product_schema import ProductCreate, ProductUpdate, ProductOut

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("", response_model=List[ProductOut])
def list_products(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Any logged-in role (OWNER, MANAGER, STAFF) can VIEW products —
    # staff need to see stock while creating orders.
    products = (
        db.query(Product)
        .filter(Product.tenant_id == current_user.tenant_id)
        .order_by(Product.name.asc())
        .all()
    )
    return products


@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.tenant_id == current_user.tenant_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    current_user: User = Depends(require_roles(RoleEnum.OWNER, RoleEnum.MANAGER)),
    db: Session = Depends(get_db),
):
    new_product = Product(
        tenant_id=current_user.tenant_id,
        name=payload.name,
        sku=payload.sku,
        category=payload.category,
        price=payload.price,
        stock_quantity=payload.stock_quantity,
        reorder_threshold=payload.reorder_threshold,
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    current_user: User = Depends(require_roles(RoleEnum.OWNER, RoleEnum.MANAGER)),
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.tenant_id == current_user.tenant_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # Only update fields the client actually provided (partial update pattern)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    current_user: User = Depends(require_roles(RoleEnum.OWNER)),
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.tenant_id == current_user.tenant_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    db.delete(product)
    db.commit()
    return None