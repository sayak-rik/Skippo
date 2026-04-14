from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from common.demo_state import get_state


class ComplianceRootView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"module": "compliance", "status": "ready", "mode": "demo"})


class DriverRenewalsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"results": get_state()["renewals"]})
