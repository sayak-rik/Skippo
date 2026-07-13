from django.conf import settings
from django.http import JsonResponse


class BearerTokenMiddleware:
    """Reject requests without the correct Authorization: Bearer <EXAM_LB_SECRET> header.

    Exemptions:
      - /health/  — always public (for Docker health checks)
      - /fetch-config/ — called by exam-engine pods which share the same secret
    """

    PUBLIC_PREFIXES = ("/health",)

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        secret = settings.EXAM_LB_SECRET
        if not secret:
            # Auth not configured (dev mode) — allow all
            return self.get_response(request)

        for prefix in self.PUBLIC_PREFIXES:
            if request.path.startswith(prefix):
                return self.get_response(request)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return JsonResponse({"detail": "Authorization header required."}, status=401)

        token = auth_header[len("Bearer "):]
        if token != secret:
            return JsonResponse({"detail": "Invalid token."}, status=403)

        return self.get_response(request)
