"""Thin application composition root; business logic lives in app/ services and routes."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.services.seed import seed_database

@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.upload_dir.mkdir(exist_ok=True)
    Base.metadata.create_all(engine)
    with engine.begin() as conn:
        columns=[row[1] for row in conn.exec_driver_sql("PRAGMA table_info(questions)")]
        if "logic" not in columns: conn.exec_driver_sql("ALTER TABLE questions ADD COLUMN logic JSON DEFAULT '{}'")
    db=SessionLocal()
    try: seed_database(db)
    finally: db.close()
    yield

app = FastAPI(title="Formly API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")
app.include_router(api_router, prefix=settings.api_prefix)
