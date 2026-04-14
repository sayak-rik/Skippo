#!/bin/sh
set -eu

echo "[beat] Waiting for PostgreSQL..."
until nc -z "${PGHOST:-postgres}" "${PGPORT:-5432}"; do
  sleep 1
done
echo "[beat] PostgreSQL is up."

echo "[beat] Waiting for Redis..."
until nc -z "${REDISHOST:-redis}" "${REDISPORT:-6379}"; do
  sleep 1
done
echo "[beat] Redis is up."

echo "[beat] Starting Celery beat..."
exec celery -A skippo_backend beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler 2>/dev/null \
  || exec celery -A skippo_backend beat -l info
