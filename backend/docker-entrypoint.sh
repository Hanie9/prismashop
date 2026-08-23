#!/bin/sh
set -eu

python - <<'PY'
import sys
import time

from sqlalchemy import text

from app.core.database import engine

for attempt in range(60):
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("database is ready", flush=True)
        sys.exit(0)
    except Exception as exc:
        print(f"waiting for database ({attempt + 1}/60): {exc}", flush=True)
        time.sleep(2)
print("database did not become ready", flush=True)
sys.exit(1)
PY

python -m app.seed.run

exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --proxy-headers \
    --forwarded-allow-ips='*' \
    --workers 2
