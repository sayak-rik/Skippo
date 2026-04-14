#!/bin/sh
set -eu

echo "[worker] Waiting for PostgreSQL..."
until nc -z "${PGHOST:-postgres}" "${PGPORT:-5432}"; do
  sleep 1
done
echo "[worker] PostgreSQL is up."

echo "[worker] Waiting for Redis..."
until nc -z "${REDISHOST:-redis}" "${REDISPORT:-6379}"; do
  sleep 1
done
echo "[worker] Redis is up."

echo "[worker] Starting Celery worker..."
exec celery -A skippo_backend worker -l info --concurrency=2
