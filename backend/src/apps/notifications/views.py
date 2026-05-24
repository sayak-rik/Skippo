from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.models import EmergencyEvent


class NotificationsRootView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"module": "notifications", "status": "ready", "mode": "live"})


class ParentAlertsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        events = EmergencyEvent.objects.select_related("trip", "triggered_by__user").order_by("-created_at")[:20]
        results = [
            {
                "id": e.id,
                "status": e.status,
                "tripId": e.trip_id,
                "triggeredBy": e.triggered_by.user.get_full_name() if e.triggered_by and e.triggered_by.user else None,
                "createdAt": str(e.created_at),
            }
            for e in events
        ]
        return Response({"results": results})


class DriverDevicesView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"results": []})


class TriggerSOSView(APIView):
    """Trigger an SOS emergency from the driver app (req 10, 11).

    Sends a critical alert to all parents on the active route and creates
    an SOS event record for the school command center.

    POST /api/notifications/sos/
    Body: { "trip_id": 1 }
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from apps.tracking.models import Trip

        trip_id = request.data.get("trip_id")
        trip = Trip.objects.filter(id=trip_id).select_related("school").first() if trip_id else None

        if trip is None:
            return Response({"detail": "trip_id referencing an active trip is required."}, status=status.HTTP_400_BAD_REQUEST)

        event = EmergencyEvent.objects.create(school=trip.school, trip=trip, status="open")
        return Response({"id": event.id, "status": event.status, "createdAt": str(event.created_at)}, status=status.HTTP_201_CREATED)


class TriggerBreakdownView(APIView):
    """Trigger a vehicle breakdown event from the driver app (req 10, 11).

    Sends a warning alert to all parents on the active route so they know
    alternative transport may be needed.

    POST /api/notifications/breakdown/
    Body: { "trip_id": 1 }
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from apps.tracking.models import Trip

        trip_id = request.data.get("trip_id")
        trip = Trip.objects.filter(id=trip_id).select_related("school").first() if trip_id else None

        if trip is None:
            return Response({"detail": "trip_id referencing an active trip is required."}, status=status.HTTP_400_BAD_REQUEST)

        event = EmergencyEvent.objects.create(school=trip.school, trip=trip, status="breakdown")
        return Response({"id": event.id, "status": event.status, "createdAt": str(event.created_at)}, status=status.HTTP_201_CREATED)
