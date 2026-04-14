from django.urls import path

from apps.tracking.consumers import TripTrackingConsumer

websocket_urlpatterns = [
    path("ws/trips/<int:trip_id>/", TripTrackingConsumer.as_asgi()),
]
