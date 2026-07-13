FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONPATH=/app \
    DJANGO_SETTINGS_MODULE=examlb.settings \
    PYTHONUNBUFFERED=1

EXPOSE 8094

# Web container applies migrations on boot; worker/beat override this command
# in docker-compose so they never race the migration step.
CMD ["sh", "-c", "python manage.py migrate --noinput && exec gunicorn examlb.wsgi:application --bind 0.0.0.0:8094 --workers 2 --timeout 60 --access-logfile -"]
