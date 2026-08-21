from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

# Pool sized for concurrent traffic without Docker; tune via env if needed.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_recycle=settings.DB_POOL_RECYCLE,
    pool_timeout=30,
)


@event.listens_for(engine, "connect")
def _set_statement_timeout(dbapi_connection, _connection_record) -> None:
    # Prevent runaway queries under load (ms).
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("SET statement_timeout = '15000'")
    except Exception:
        pass
    finally:
        cursor.close()


SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
