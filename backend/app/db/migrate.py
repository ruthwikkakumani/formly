from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def _add_column_if_missing(engine: Engine, table: str, column: str, ddl: str) -> None:
    inspector = inspect(engine)
    if table not in inspector.get_table_names():
        return
    existing = {item["name"] for item in inspector.get_columns(table)}
    if column in existing:
        return
    with engine.begin() as connection:
        connection.execute(text(ddl))


def ensure_sqlite_columns(engine: Engine) -> None:
    """Additive SQLite patches for databases created before newer columns existed."""
    _add_column_if_missing(
        engine, "questions", "logic", "ALTER TABLE questions ADD COLUMN logic JSON DEFAULT '{}'"
    )
    _add_column_if_missing(
        engine, "forms", "webhook_url", "ALTER TABLE forms ADD COLUMN webhook_url VARCHAR(500) DEFAULT ''"
    )
    _add_column_if_missing(
        engine, "forms", "updated_by", "ALTER TABLE forms ADD COLUMN updated_by VARCHAR(120) DEFAULT ''"
    )
    _add_column_if_missing(
        engine,
        "forms",
        "updated_by_email",
        "ALTER TABLE forms ADD COLUMN updated_by_email VARCHAR(180) DEFAULT ''",
    )
    _add_column_if_missing(
        engine,
        "workspace_members",
        "password_hash",
        "ALTER TABLE workspace_members ADD COLUMN password_hash VARCHAR(200) DEFAULT ''",
    )
    _add_column_if_missing(
        engine,
        "workspace_invites",
        "email_error",
        "ALTER TABLE workspace_invites ADD COLUMN email_error TEXT",
    )
