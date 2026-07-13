from django.conf import settings
from django.http import JsonResponse


class BearerTokenMiddleware:
    """Require Authorization: Bearer <AITLB_SECRET> on all routes except /health/."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        secret = getattr(settings, "AITLB_SECRET", "")
        if secret and not request.path.startswith("/health"):
            auth = request.META.get("HTTP_AUTHORIZATION", "")
            if auth != f"Bearer {secret}":
                return JsonResponse({"detail": "Unauthorized."}, status=401)
        return self.get_response(request)
