from django.urls import path

from apps.tracking.views import FleetTrackingView, TrackingRootView, TripTrackingDetailView

urlpatterns = [
    path("", TrackingRootView.as_view(), name="tracking-root"),
    path("fleet/live/", FleetTrackingView.as_view(), name="tracking-fleet-live"),
    path("trips/<int:trip_id>/live/", TripTrackingDetailView.as_view(), name="tracking-trip-live"),
]
