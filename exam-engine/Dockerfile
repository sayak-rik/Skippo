# ── Build stage: compile React frontend ──────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY exam-frontend/package*.json ./
RUN npm ci --prefer-offline
COPY exam-frontend/ ./
RUN npm run build

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy FastAPI application
COPY app/ ./app/

# Copy compiled React frontend (vite outDir is ../static relative to /frontend)
COPY --from=frontend-builder /static/ ./static/

ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    PORT=8080

EXPOSE 8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
