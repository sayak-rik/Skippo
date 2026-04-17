from django.urls import path

from apps.tracking.views import (
    FleetTrackingView,
    PingTripLocationView,
    TrackingRootView,
    TripTrackingDetailView,
)

urlpatterns = [
    path("", TrackingRootView.as_view(), name="tracking-root"),
    path("fleet/live/", FleetTrackingView.as_view(), name="tracking-fleet-live"),

    # Parent polls this every 60 s to get the latest bus location (req 1)
    path("trips/<int:trip_id>/live/", TripTrackingDetailView.as_view(), name="tracking-trip-live"),

    # Driver app posts a ping here every 60 s when trip is active (req 1)
    path("trips/<int:trip_id>/ping/", PingTripLocationView.as_view(), name="tracking-trip-ping"),
]
