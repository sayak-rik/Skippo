from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from common.demo_state import get_state, parent_dashboard, teacher_dashboard


class ReportsRootView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"module": "reports", "status": "ready", "mode": "demo"})


class ParentDashboardReportView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(parent_dashboard())


class TeacherEndOfDayView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"results": teacher_dashboard()["dailyPreview"]})
