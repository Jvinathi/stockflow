from fastapi import FastAPI
from sqlalchemy import text

from app.database import engine, Base
from app import models  # noqa: F401 -- ensures all models are registered with Base

# Create all tables defined in our models (if they don't already exist)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="StockFlow API", version="1.0.0")


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