from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from common.demo_state import get_state, trigger_sos


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
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        event = trigger_sos()
        return Response(event, status=status.HTTP_201_CREATED)
