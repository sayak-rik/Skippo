from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def healthcheck(_request):
    return JsonResponse({"status": "ok", "service": "skippo-backend"})


urlpatterns = [
    path("health/", healthcheck, name="healthcheck"),
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/transport/", include("apps.transport.urls")),
    path("api/tracking/", include("apps.tracking.urls")),
    path("api/academics/", include("apps.academics.urls")),
    path("api/communications/", include("apps.communications.urls")),
    path("api/compliance/", include("apps.compliance.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
    path("api/reports/", include("apps.reports.urls")),
    path("api/dismissal/", include("apps.dismissal.urls")),
    path("api/calls/",     include("apps.calls.urls")),
    path("api/payments/",     include("apps.payments.urls")),
    path("api/tenancy/",      include("apps.tenancy.urls")),
    path("api/assessments/",  include("apps.assessments.urls")),
    path("api/ai-classes/",   include("apps.ai_classes.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
