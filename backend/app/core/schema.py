"""Keep existing Postgres tables aligned with SQLAlchemy models.

``create_all`` only creates missing tables; it does not add columns.
These patches must run before any ORM query (including seed).
"""

from sqlalchemy import inspect, text

from app.core.database import Base, engine


def _exec_ignore(stmt: str) -> None:
    with engine.begin() as conn:
        try:
            conn.execute(text(stmt))
        except Exception:
            pass


def _sql_default(column) -> str | None:
    if column.server_default is not None:
        return None
    default = column.default
    if default is None or getattr(default, "is_callable", False):
        return None
    arg = getattr(default, "arg", None)
    if arg is None or callable(arg):
        return None
    if isinstance(arg, bool):
        return "true" if arg else "false"
    if isinstance(arg, (int, float)):
        return str(arg)
    if isinstance(arg, str):
        return "'" + arg.replace("'", "''") + "'"
    if arg == []:
        return "'[]'::json"
    return None


def _add_missing_columns() -> None:
    inspector = inspect(engine)
    dialect = engine.dialect
    table_names = set(inspector.get_table_names())
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if table.name not in table_names:
                continue
            existing = {col["name"] for col in inspector.get_columns(table.name)}
            for column in table.columns:
                if column.name in existing:
                    continue
                type_sql = column.type.compile(dialect)
                stmt = (
                    f'ALTER TABLE "{table.name}" '
                    f'ADD COLUMN IF NOT EXISTS "{column.name}" {type_sql}'
                )
                default_sql = _sql_default(column)
                if default_sql is not None:
                    stmt += f" DEFAULT {default_sql}"
                    if not column.nullable:
                        stmt += " NOT NULL"
                elif column.nullable:
                    stmt += " NULL"
                try:
                    conn.execute(text(stmt))
                except Exception:
                    pass
            existing_indexes = {
                idx["name"] for idx in inspector.get_indexes(table.name) if idx.get("name")
            }
            for index in table.indexes:
                if not index.name or index.name in existing_indexes:
                    continue
                try:
                    index.create(bind=conn)
                except Exception:
                    pass


def ensure_schema() -> None:
    import app.models  # noqa: F401 — register all SQLAlchemy models

    Base.metadata.create_all(bind=engine)
    _add_missing_columns()

    for stmt in (
        "ALTER TABLE users ALTER COLUMN email DROP NOT NULL",
        "ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL",
        "ALTER TABLE admin_users ALTER COLUMN password_hash DROP NOT NULL",
        "ALTER TABLE admin_users ALTER COLUMN email DROP NOT NULL",
        "ALTER TABLE wishlist_items ALTER COLUMN user_id DROP NOT NULL",
        "DROP INDEX IF EXISTS uq_wishlist_user_product",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_wishlist_user_product "
        "ON wishlist_items (user_id, product_id) WHERE user_id IS NOT NULL",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_wishlist_session_product "
        "ON wishlist_items (session_id, product_id) WHERE session_id IS NOT NULL",
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_admin_users_mobile "
        "ON admin_users (mobile) WHERE mobile IS NOT NULL",
    ):
        _exec_ignore(stmt)
