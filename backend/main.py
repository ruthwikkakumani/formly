"""Application composition root. Domain logic lives under app/."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text

from app.api.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import Answer, Form, Member, PartialResponse, Question, Response  # noqa: F401
from app.services.seed import seed_database


def _ensure_sqlite_columns() -> None:
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    if "questions" in tables:
        columns = {column["name"] for column in inspector.get_columns("questions")}
        if "logic" not in columns:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE questions ADD COLUMN logic JSON DEFAULT '{}'"))
    if "forms" in tables:
        form_columns = {column["name"] for column in inspector.get_columns("forms")}
        if "webhook_url" not in form_columns:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE forms ADD COLUMN webhook_url VARCHAR(500) DEFAULT ''"))


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.upload_dir.mkdir(exist_ok=True)
    Base.metadata.create_all(engine)
    _ensure_sqlite_columns()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Formly API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")
app.include_router(api_router, prefix=settings.api_prefix)
