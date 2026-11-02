# ==============================================================================
# Borsaty Monorepo Root Dockerfile for Analysis Engine Service
# ==============================================================================

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    HOST=0.0.0.0

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2 \
    libcairo2-dev \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpangoft2-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libgdk-pixbuf-2.0-dev \
    libffi-dev \
    shared-mime-info \
    fonts-dejavu-core \
    fonts-noto-core \
    fonts-freefont-ttf \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY packages/analysis/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy analysis engine and reports package
COPY packages/analysis /app/packages/analysis
COPY packages/reports /app/packages/reports

WORKDIR /app/packages/analysis
ENV PYTHONPATH="/app/packages:/app/packages/analysis:${PYTHONPATH}"

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

CMD ["sh", "-c", "uvicorn main:app --host ${HOST:-0.0.0.0} --port ${PORT:-8000}"]
