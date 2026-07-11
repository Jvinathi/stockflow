from typing import Optional

from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: Optional[str] = Field(None, max_length=100)
    category: Optional[str] = Field(None, max_length=100)
    price: float = Field(..., ge=0)
    stock_quantity: int = Field(0, ge=0)
    reorder_threshold: int = Field(5, ge=0)


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, max_length=100)
    category: Optional[str] = Field(None, max_length=100)
    price: Optional[float] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    reorder_threshold: Optional[int] = Field(None, ge=0)


class ProductOut(BaseModel):
    id: int
    name: str
    sku: Optional[str]
    category: Optional[str]
    price: float
    stock_quantity: int
    reorder_threshold: int

    class Config:
        from_attributes = True