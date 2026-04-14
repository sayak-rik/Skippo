from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.tracking.services.google_maps import google_maps_config
from common.demo_state import tracking_fleet, tracking_trip


class TrackingRootView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(
            {
                "module": "tracking",
                "status": "ready",
                "map_provider": google_maps_config()["provider"],
            }
        )


class FleetTrackingView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(
            {
                "map": google_maps_config(),
                "results": tracking_fleet(),
            }
        )


class TripTrackingDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, trip_id: int):
        trip = tracking_trip(trip_id)
        if trip is None:
            return Response({"detail": "Trip not found."}, status=404)
        return Response(
            {
                "map": google_maps_config(),
                "result": trip,
            }
        )
