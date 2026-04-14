from django.conf import settings


def google_maps_config() -> dict[str, str]:
    """
    Exposes client configuration for rendering tracking on Google Maps.
    Backend tracking is still GPS-coordinate based; the dashboard and apps
    use this config to render trips with the Google Maps SDK.
    """

    return {
        "provider": "google_maps",
        "api_key": settings.GOOGLE_MAPS_API_KEY,
    }
