#!/bin/sh
set -eu

python manage.py migrate --noinput --run-syncdb
python manage.py collectstatic --noinput
daphne -b 0.0.0.0 -p 8000 skippo_backend.asgi:application
