from pathlib import Path

import dj_database_url
import environ

env = environ.Env(
    DJANGO_DEBUG=(bool, False),
    DJANGO_SECRET_KEY=(str, "insecure-dev-key"),
    DJANGO_ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1", "backend"]),
    CORS_ALLOWED_ORIGINS=(list, ["http://localhost:3000"]),
    CSRF_TRUSTED_ORIGINS=(list, ["http://localhost:3000"]),
    DATABASE_URL=(str, "postgresql://skippo:skippo@localhost:5432/skippo"),
    REDIS_URL=(str, "redis://localhost:6379/0"),
    CALL_AGENT_URL=(str, "http://call-agent:8091"),
    PAYMENT_SERVICE_URL=(str, "http://payment-service:8092"),
    CELERY_BROKER_URL=(str, "redis://localhost:6379/1"),
    CELERY_RESULT_BACKEND=(str, "redis://localhost:6379/2"),
    GOOGLE_MAPS_API_KEY=(str, ""),
    SMS_SERVICE_URL=(str, "http://sms-service:8090"),
    MSG91_AUTH_KEY=(str, ""),
    MSG91_SENDER_ID=(str, "SKIPPO"),
    MSG91_TEMPLATE_ID=(str, ""),
    RAZORPAY_KEY_ID=(str, ""),
    RAZORPAY_KEY_SECRET=(str, ""),
    RAZORPAY_WEBHOOK_SECRET=(str, ""),
    PLATFORM_COMMISSION_PCT=(str, "2.0"),
)

BASE_DIR = Path(__file__).resolve().parents[3]
SRC_DIR = BASE_DIR / "src"

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env("DJANGO_DEBUG")
ALLOWED_HOSTS = env("DJANGO_ALLOWED_HOSTS")

INSTALLED_APPS = [
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "drf_spectacular",
    "django_filters",
    "channels",
    "apps.accounts",
    "apps.tenancy",
    "apps.transport",
    "apps.tracking",
    "apps.academics",
    "apps.communications",
    "apps.compliance",
    "apps.notifications",
    "apps.reports",
    "apps.dismissal",
    "apps.calls",
    "apps.payments",
    "django_celery_beat",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "common.middleware.tenant.TenantContextMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "skippo_backend.urls"
ASGI_APPLICATION = "skippo_backend.asgi.application"
WSGI_APPLICATION = "skippo_backend.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

DATABASES = {
    "default": dj_database_url.parse(
        env("DATABASE_URL"),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": env("REDIS_URL"),
    }
}

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [env("REDIS_URL")]},
    }
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
    ),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Skippo API",
    "DESCRIPTION": "Unified API for transport, academics, compliance, and communications.",
    "VERSION": "0.1.0",
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.PlatformUser"

CORS_ALLOWED_ORIGINS = env("CORS_ALLOWED_ORIGINS")
CSRF_TRUSTED_ORIGINS = env("CSRF_TRUSTED_ORIGINS")

CELERY_BROKER_URL = env("CELERY_BROKER_URL")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND")
CELERY_TASK_TIME_LIMIT = 60 * 10
CELERY_TASK_SOFT_TIME_LIMIT = 60 * 5
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_BEAT_SCHEDULE = {
    "expire-old-pickup-intents": {
        "task": "apps.dismissal.tasks.expire_old_pickup_intents",
        "schedule": 60 * 60 * 3,  # every 3 hours
    },
    "process-call-queue": {
        "task": "apps.calls.tasks.process_call_queue",
        "schedule": 60,  # every 1 minute
    },
    "send-fee-reminders": {
        "task": "apps.payments.tasks.send_fee_reminders",
        "schedule": 60 * 60 * 24,  # daily at beat tick
    },
    "mark-overdue-invoices": {
        "task": "apps.payments.tasks.mark_overdue_invoices",
        "schedule": 60 * 60 * 24,  # daily
    },
}

CALL_AGENT_URL    = env("CALL_AGENT_URL")
PAYMENT_SERVICE_URL = env("PAYMENT_SERVICE_URL")

RAZORPAY_KEY_ID       = env("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET   = env("RAZORPAY_KEY_SECRET")
RAZORPAY_WEBHOOK_SECRET = env("RAZORPAY_WEBHOOK_SECRET")
PLATFORM_COMMISSION_PCT = env("PLATFORM_COMMISSION_PCT")

TENANT_HEADER = "HTTP_X_SCHOOL_SLUG"
GOOGLE_MAPS_API_KEY = env("GOOGLE_MAPS_API_KEY")

SMS_SERVICE_URL = env("SMS_SERVICE_URL")
MSG91_AUTH_KEY = env("MSG91_AUTH_KEY")
MSG91_SENDER_ID = env("MSG91_SENDER_ID")
MSG91_TEMPLATE_ID = env("MSG91_TEMPLATE_ID")
