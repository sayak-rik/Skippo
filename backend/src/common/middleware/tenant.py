from django.conf import settings


class TenantContextMiddleware:
    """
    Resolves tenant context from host or explicit headers.
    This is intentionally lightweight for now and will be replaced
    by stronger tenancy resolution once the domain model is wired.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.tenant_slug = request.META.get(settings.TENANT_HEADER)
        return self.get_response(request)
