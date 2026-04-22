from django.urls import path

from apps.dismissal.consumers import DismissalConsumer
from apps.tracking.consumers import TripTrackingConsumer

websocket_urlpatterns = [
    path("ws/trips/<int:trip_id>/", TripTrackingConsumer.as_asgi()),
    path("ws/dismissal/<int:school_id>/", DismissalConsumer.as_asgi()),
]
