#!/bin/sh
set -eu

celery -A skippo_backend worker -l info
