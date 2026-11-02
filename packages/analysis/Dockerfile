# ==============================================================================
# Borsaty Financial Analysis Engine Dockerfile (FastAPI + AI + WeasyPrint/PDF)
# Optimized for Render, Fly.io, Railway, and standard Docker environments
# ==============================================================================

FROM python:3.11-slim

# Prevent python from writing pyc files to disc and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    HOST=0.0.0.0

WORKDIR /app

# Install system dependencies for WeasyPrint, Cairo, Pango, and Arabic Fonts
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

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy analysis engine source code
COPY . /app

# Ensure reports package is in python path
ENV PYTHONPATH="/app:/app/reports:${PYTHONPATH}"

EXPOSE 8000

# Health check to ensure service readiness
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Launch production Uvicorn server respecting Render dynamic $PORT
CMD ["sh", "-c", "uvicorn main:app --host ${HOST:-0.0.0.0} --port ${PORT:-8000}"]
