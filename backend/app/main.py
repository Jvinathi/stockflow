from fastapi import FastAPI, Depends
from sqlalchemy import text

from app.database import engine, Base
from app import models  # noqa: F401 -- ensures all models are registered with Base
from app.routers import auth_router, user_router, product_router, order_router
from app.core.deps import get_current_user
from app.models.user import User

Base.metadata.create_all(bind=engine)

app = FastAPI(title="StockFlow API", version="1.0.0")

app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(product_router.router)
app.include_router(order_router.router)


@app.get("/")
def root():
    return {"message": "StockFlow backend is running"}


@app.get("/health/db")
def db_health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"database": "connected"}
    except Exception as e:
        return {"database": "connection failed", "error": str(e)}


@app.get("/api/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "tenant_id": current_user.tenant_id,
        "role": current_user.role.value,
    }