from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from common.demo_state import get_state, trigger_breakdown, trigger_sos


class NotificationsRootView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"module": "notifications", "status": "ready", "mode": "demo"})


class ParentAlertsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"results": get_state()["alerts"]})


class DriverDevicesView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"results": get_state()["devices"]})


class TriggerSOSView(APIView):
    """Trigger an SOS emergency from the driver app (req 10, 11).

    Sends a critical alert to all parents on the active route and creates
    an SOS event record for the school command center.

    POST /api/notifications/sos/
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        event = trigger_sos()
        return Response(event, status=status.HTTP_201_CREATED)


class TriggerBreakdownView(APIView):
    """Trigger a vehicle breakdown event from the driver app (req 10, 11).

    Sends a warning alert to all parents on the active route so they know
    alternative transport may be needed.  Unlike SOS, a breakdown is not an
    emergency but parents must be informed immediately.

    The driver can then use the /api/transport/nearby-vehicles/ endpoint to
    contact other school vehicles for assistance (req 12).

    POST /api/notifications/breakdown/
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        event = trigger_breakdown()
        return Response(event, status=status.HTTP_201_CREATED)
