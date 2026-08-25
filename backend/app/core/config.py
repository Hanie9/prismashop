from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str = "postgresql+psycopg://prisma:prisma@localhost:5432/prismashop"
    SECRET_KEY: str = "dev-secret-change-me-prismashop"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # Session (server-side)
    SESSION_COOKIE_NAME: str = "prismashop_session"
    SESSION_HEADER_NAME: str = "X-Session-Id"
    SESSION_COOKIE_SECURE: bool = False
    SESSION_EXPIRE_DAYS: int = 14
    SESSION_SHORT_EXPIRE_DAYS: int = 1
    SESSION_GUEST_EXPIRE_DAYS: int = 7

    ADMIN_EMAIL: str = "admin@prismashop.ir"
    ADMIN_PASSWORD: str = "admin123"
    ADMIN_MOBILE: str = "09355191020"

    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    UPLOAD_DIR: str = "uploads"
    PUBLIC_BASE_URL: str = "http://localhost:8000"

    # Connection pool (high concurrency)
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 40
    DB_POOL_RECYCLE: int = 1800

    FREE_SHIPPING_THRESHOLD: int = 500_000
    SHIPPING_COST: int = 60_000
    MAX_PRODUCT_IMAGES: int = 8

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def upload_path(self) -> Path:
        path = Path(self.UPLOAD_DIR)
        if not path.is_absolute():
            path = BACKEND_ROOT / path
        path.mkdir(parents=True, exist_ok=True)
        return path


@lru_cache
def get_settings() -> Settings:
    return Settings()
