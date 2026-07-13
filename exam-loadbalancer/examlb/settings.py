import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "insecure-exam-lb-dev-key")
DEBUG = os.environ.get("DJANGO_DEBUG", "false").lower() == "true"
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "rest_framework",
    "loadbalancer",
]

# JSON-only API — the browsable renderer needs the templates app, which this
# slim service deliberately does not install.
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ("rest_framework.renderers.JSONRenderer",),
    "DEFAULT_AUTHENTICATION_CLASSES": (),
    "DEFAULT_PERMISSION_CLASSES": (),
    "UNAUTHENTICATED_USER": None,
}

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
    "loadbalancer.middleware.BearerTokenMiddleware",
]

ROOT_URLCONF = "examlb.urls"
WSGI_APPLICATION = "examlb.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME":     os.environ.get("DB_NAME",     "exam_lb"),
        "USER":     os.environ.get("DB_USER",     "exam_lb"),
        "PASSWORD": os.environ.get("DB_PASSWORD", "exam_lb"),
        "HOST":     os.environ.get("DB_HOST",     "postgres"),
        "PORT":     os.environ.get("DB_PORT",     "5432"),
    }
}

REDIS_DSN = os.environ.get("REDIS_URL", "redis://redis:6379/5")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_TZ = True

# ── Celery ─────────────────────────────────────────────────────────────────────
CELERY_BROKER_URL         = REDIS_DSN
CELERY_RESULT_BACKEND     = REDIS_DSN
CELERY_TIMEZONE           = TIME_ZONE
CELERY_TASK_DEFAULT_QUEUE = "exam_loadbalancer"
CELERY_WORKER_HIJACK_ROOT_LOGGER = False
CELERY_BEAT_SCHEDULE = {
    "cleanup-stale-pods": {
        "task":     "loadbalancer.tasks.cleanup_stale_pods",
        "schedule": int(os.environ.get("STALE_POD_SWEEP_SECONDS", "300")),
        "options":  {"queue": "exam_loadbalancer"},
    },
}

# ── Exam loadbalancer config ───────────────────────────────────────────────────
EXAM_LB_SECRET                 = os.environ.get("EXAM_LB_SECRET", "")
POD_SESSION_CAPACITY           = int(os.environ.get("POD_SESSION_CAPACITY", "2"))
POD_GRACE_PERIOD_SECONDS       = int(os.environ.get("POD_GRACE_PERIOD_SECONDS", "1800"))
POD_HEARTBEAT_TIMEOUT_SECONDS  = int(os.environ.get("POD_HEARTBEAT_TIMEOUT_SECONDS", "3600"))

# ── Pod provider ───────────────────────────────────────────────────────────────
# "fly"    → Fly.io Machines API (production default)
# "docker" → local Docker daemon (development; needs /var/run/docker.sock mounted)
POD_PROVIDER = os.environ.get("POD_PROVIDER", "fly").strip().lower()

# ── Fly.io ─────────────────────────────────────────────────────────────────────
FLY_API_TOKEN     = os.environ.get("FLY_API_TOKEN", "")
FLY_APP_NAME      = os.environ.get("FLY_APP_NAME", "skippo-exam-engine")
FLY_MACHINE_IMAGE = os.environ.get("FLY_MACHINE_IMAGE", "registry.fly.io/skippo-exam-engine:latest")
FLY_MACHINE_BASE_URL = os.environ.get("FLY_MACHINE_BASE_URL", "")

# ── Local Docker provider ──────────────────────────────────────────────────────
LOCAL_ENGINE_IMAGE = os.environ.get("LOCAL_ENGINE_IMAGE", "skippo-exam-engine:local")
DOCKER_NETWORK     = os.environ.get("DOCKER_NETWORK", "skippo-network")
# Hostname students' browsers use to reach a locally published pod port
DOCKER_POD_HOST    = os.environ.get("DOCKER_POD_HOST", "localhost")

# env vars forwarded into every exam-engine pod
EXAM_ENGINE_ENV = {
    "SKIPPO_WEBHOOK_URL":    os.environ.get("SKIPPO_WEBHOOK_URL",    ""),
    "SKIPPO_WEBHOOK_SECRET": os.environ.get("SKIPPO_WEBHOOK_SECRET", ""),
    "EXAM_LB_URL":           os.environ.get("EXAM_LB_INTERNAL_URL",  "http://exam-loadbalancer:8094"),
    "EXAM_LB_SECRET":        os.environ.get("EXAM_LB_SECRET",        ""),
    "LLM_API_KEY":           os.environ.get("LLM_API_KEY",           ""),
    "LLM_PROVIDER":          os.environ.get("LLM_PROVIDER",          "google"),
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {"format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "standard",
        },
    },
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "loadbalancer": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
    },
}
