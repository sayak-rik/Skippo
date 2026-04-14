#!/bin/sh
set -eu

celery -A skippo_backend beat -l info
