from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.tracking.services.google_maps import google_maps_config
from apps.tracking.models import Trip, LiveLocation


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
        trips = Trip.objects.filter(status="active").select_related(
            "route", "vehicle", "driver__user", "school"
        )
        results = []
        for t in trips:
            latest = LiveLocation.objects.filter(trip=t).order_by("-created_at").first()
            results.append(
                {
                    "id": t.id,
                    "routeName": t.route.name if t.route else "",
                    "busLabel": t.vehicle.registration_number if t.vehicle else "",
                    "status": t.status,
                    "location": {
                        "latitude": float(latest.latitude),
                        "longitude": float(latest.longitude),
                    }
                    if latest
                    else None,
                }
            )
        return Response({"map": google_maps_config(), "results": results})


class TripTrackingDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, trip_id: int):
        trip = (
            Trip.objects.filter(id=trip_id)
            .select_related("route", "vehicle", "driver__user")
            .first()
        )
        if trip is None:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)

        latest = LiveLocation.objects.filter(trip=trip).order_by("-created_at").first()

        return Response(
            {
                "map": google_maps_config(),
                "result": {
                    "id": trip.id,
                    "routeName": trip.route.name if trip.route else "",
                    "busLabel": trip.vehicle.registration_number if trip.vehicle else "",
                    "status": trip.status,
                    "etaMinutes": 0,
                    "busLocation": {
                        "latitude": float(latest.latitude),
                        "longitude": float(latest.longitude),
                        "speed": float(latest.speed or 0),
                        "heading": float(latest.heading or 0),
                        "updatedAt": str(latest.created_at),
                    }
                    if latest
                    else None,
                },
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

        from apps.transport.models import Trip as TransportTrip, TripLocationPing

        trip = TransportTrip.objects.filter(id=trip_id, status="active").first()
        if trip is None:
            return Response(
                {"detail": "Trip not found or not currently active."},
                status=status.HTTP_404_NOT_FOUND,
            )

        ping = TripLocationPing.objects.create(
            trip=trip,
            latitude=float(latitude),
            longitude=float(longitude),
            speed=float(speed),
            heading=float(heading),
        )

        return Response(
            {
                "id": ping.id,
                "latitude": float(ping.latitude),
                "longitude": float(ping.longitude),
                "createdAt": str(ping.created_at),
            },
            status=status.HTTP_201_CREATED,
        )
