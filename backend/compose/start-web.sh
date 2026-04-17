#!/bin/sh
set -eu

echo "[web] Waiting for PostgreSQL..."
until nc -z "${PGHOST:-postgres}" "${PGPORT:-5432}"; do
  sleep 1
done
echo "[web] PostgreSQL is up."

echo "[web] Waiting for Redis..."
until nc -z "${REDISHOST:-redis}" "${REDISPORT:-6379}"; do
  sleep 1
done
echo "[web] Redis is up."

echo "[web] Creating migrations for any unmigrated apps..."
python manage.py makemigrations --noinput

echo "[web] Running migrations..."
python manage.py migrate --noinput

echo "[web] Collecting static files..."
python manage.py collectstatic --noinput

echo "[web] Starting Daphne..."
exec daphne -b 0.0.0.0 -p 8000 skippo_backend.asgi:application
