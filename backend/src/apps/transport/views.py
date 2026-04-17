from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from common.demo_state import (
    board_student,
    change_student_bus,
    confirm_first_trip_stop,
    driver_dashboard,
    drop_student,
    end_trip,
    get_driver_contact,
    get_student_stop_override,
    list_available_routes,
    list_driver_vehicles,
    list_nearby_vehicles,
    start_trip,
    switch_active_vehicle,
    update_student_stop,
)


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


# ── Route / bus management (req 3) ───────────────────────────────────────────

class AvailableRoutesView(APIView):
    """List all routes a parent can assign their ward to (req 3).

    GET /api/transport/parent/routes/
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"results": list_available_routes()})


class ParentChangeBusView(APIView):
    """Assign the parent's ward to a different bus route (req 3).

    POST /api/transport/parent/change-bus/
    Body: { "routeId": 2 }
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        route_id = request.data.get("routeId")
        if not route_id:
            return Response({"detail": "routeId is required."}, status=status.HTTP_400_BAD_REQUEST)
        result = change_student_bus(int(route_id))
        if result is None:
            return Response({"detail": "Route not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(result)


# ── Driver contact (req 4) ────────────────────────────────────────────────────

class ParentDriverContactView(APIView):
    """Return the current trip driver's name and phone (req 4).

    GET /api/transport/parent/driver-contact/
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(get_driver_contact())


# ── Stop override (req 7) ─────────────────────────────────────────────────────

class ParentUpdateStopView(APIView):
    """Parent sets or changes their ward's pick-up/drop-off stop (req 7).

    The updated stop is immediately visible to the driver in their roster.

    POST /api/transport/parent/update-stop/
    Body: { "studentId": 1, "stopName": "New Corner", "latitude": 22.5, "longitude": 88.3 }
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        student_id = request.data.get("studentId")
        stop_name = request.data.get("stopName", "").strip()
        latitude = request.data.get("latitude")
        longitude = request.data.get("longitude")

        if not all([student_id, stop_name, latitude is not None, longitude is not None]):
            return Response(
                {"detail": "studentId, stopName, latitude, and longitude are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        override = update_student_stop(int(student_id), stop_name, float(latitude), float(longitude))
        return Response(override)


class ParentConfirmFirstStopView(APIView):
    """Parent confirms the auto-suggested first-trip pickup location (req 8).

    POST /api/transport/parent/confirm-stop/
    Body: { "studentId": 1 }
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        student_id = request.data.get("studentId")
        if not student_id:
            return Response({"detail": "studentId is required."}, status=status.HTTP_400_BAD_REQUEST)
        conf = confirm_first_trip_stop(int(student_id))
        if conf is None:
            return Response(
                {"detail": "No pending first-trip confirmation for this student."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(conf)


class StudentStopView(APIView):
    """Return the current stop override for a student, if any.

    GET /api/transport/students/{student_id}/stop/
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, student_id: int):
        override = get_student_stop_override(student_id)
        if override is None:
            return Response({"stopOverride": None})
        return Response({"stopOverride": override})


# ── Nearby vehicles for breakdown (req 12) ────────────────────────────────────

class NearbyVehiclesView(APIView):
    """Return nearby school vehicles the driver can contact during a breakdown (req 12).

    GET /api/transport/nearby-vehicles/
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"results": list_nearby_vehicles()})


# ── Multi-vehicle switcher (req 13) ──────────────────────────────────────────

class DriverVehicleListView(APIView):
    """List all vehicles assigned to the current driver (req 13).

    GET /api/transport/driver/vehicles/
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"results": list_driver_vehicles()})


class DriverSwitchVehicleView(APIView):
    """Switch the driver's active vehicle (req 13).

    POST /api/transport/driver/vehicles/{vehicle_id}/activate/
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, vehicle_id: int):
        vehicle = switch_active_vehicle(vehicle_id)
        if vehicle is None:
            return Response({"detail": "Vehicle not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"activeVehicle": vehicle})
