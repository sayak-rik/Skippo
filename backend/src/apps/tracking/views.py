from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.tracking.services.google_maps import google_maps_config
from common.demo_state import ping_location, tracking_fleet, tracking_trip


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


class PingTripLocationView(APIView):
    """Receive a 1-minute GPS ping from the driver app during an active trip (req 1).

    The driver app calls this endpoint every 60 seconds while the trip is active.
    The parent LiveTrackScreen polls /tracking/trips/{id}/live/ on the same 60 s
    interval so parents always see coordinates that are at most ~2 minutes old.

    POST /api/tracking/trips/{trip_id}/ping/
    Body: { "latitude": 22.57, "longitude": 88.36, "speed": 24, "heading": 140 }
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, trip_id: int):
        latitude = request.data.get("latitude")
        longitude = request.data.get("longitude")
        speed = request.data.get("speed", 0)
        heading = request.data.get("heading", 0)

        if latitude is None or longitude is None:
            return Response(
                {"detail": "latitude and longitude are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ping = ping_location(
            trip_id,
            float(latitude),
            float(longitude),
            float(speed),
            float(heading),
        )
        if ping is None:
            return Response(
                {"detail": "Trip not found or not currently active."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(ping, status=status.HTTP_201_CREATED)
