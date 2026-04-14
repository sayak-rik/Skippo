from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from common.demo_state import board_student, driver_dashboard, drop_student, end_trip, start_trip


class TransportRootView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"module": "transport", "status": "ready", "mode": "demo"})


class DriverDashboardView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(driver_dashboard())


class StartTripView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, trip_id: int):
        trip = start_trip(trip_id)
        if not trip:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"trip": trip})


class EndTripView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, trip_id: int):
        trip = end_trip(trip_id)
        if not trip:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"trip": trip})


class BoardStudentView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, trip_id: int, student_id: int):
        student = board_student(student_id)
        if not student:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"trip_id": trip_id, "student": student})


class DropStudentView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, trip_id: int, student_id: int):
        student = drop_student(student_id)
        if not student:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"trip_id": trip_id, "student": student})
