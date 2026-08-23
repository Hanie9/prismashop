# Use the cached Debian image (node:20-bookworm-slim) so pip can install
# manylinux wheels. Official python:* images are often blocked from Iran.

FROM node:20-bookworm-slim AS builder
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        python3 \
        python3-venv \
        python3-dev \
        python3-pip \
        build-essential \
        libffi-dev \
        libjpeg-dev \
        zlib1g-dev \
        libssl-dev \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

FROM node:20-bookworm-slim AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        python3 \
        libjpeg62-turbo \
        zlib1g \
        libffi8 \
        libssl3 \
        tzdata \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 appuser \
    && useradd --system --uid 1001 --gid appuser appuser
WORKDIR /app
COPY --from=builder /opt/venv /opt/venv
COPY . /app
RUN chmod +x /app/docker-entrypoint.sh \
    && chown -R appuser:appuser /app
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    TZ=Asia/Tehran
USER appuser
EXPOSE 8000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
