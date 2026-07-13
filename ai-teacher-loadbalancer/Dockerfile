FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=aitlb.settings

EXPOSE 8095

CMD ["sh", "-c", "python manage.py migrate --noinput && exec gunicorn aitlb.wsgi:application --bind 0.0.0.0:8095 --workers 2"]
