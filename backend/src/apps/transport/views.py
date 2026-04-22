import base64
import io
import secrets
from datetime import timedelta

import qrcode
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import OTPRequest, ParentProfile
from apps.academics.models import Student, StudentParentLink
from apps.transport.models import Route, StudentBusEnrollment, StudentBusQRToken
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


# ── QR-code bus enrolment ─────────────────────────────────────────────────────

class StudentQRGenerateView(APIView):
    """Generate a single-use QR token for enrolling a student on a bus.

    The parent opens this from the app for each child.  The QR encodes a
    short-lived token that the driver scans to add the student to their route.

    GET /api/transport/students/{student_id}/qr/
    Query params:
        parent_id (int) – the ParentProfile id of the requesting parent
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, student_id: int):
        parent_id = request.query_params.get("parent_id")
        if not parent_id:
            return Response({"detail": "parent_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = Student.objects.select_related("school").get(id=student_id)
        except Student.DoesNotExist:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            parent = ParentProfile.objects.get(id=parent_id, school=student.school)
        except ParentProfile.DoesNotExist:
            return Response({"detail": "Parent not found."}, status=status.HTTP_404_NOT_FOUND)

        # Verify the parent is linked to this student
        if not StudentParentLink.objects.filter(student=student, parent=parent).exists():
            return Response(
                {"detail": "This parent is not linked to the student."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Invalidate any previous unused tokens for this student+parent pair
        StudentBusQRToken.objects.filter(
            student=student, parent=parent, is_used=False
        ).update(is_used=True)

        token = secrets.token_urlsafe(32)
        qr_record = StudentBusQRToken.objects.create(
            school=student.school,
            student=student,
            parent=parent,
            token=token,
            expires_at=timezone.now() + timedelta(minutes=15),
        )

        # Render QR image as base64 PNG
        img = qrcode.make(token)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        qr_b64 = base64.b64encode(buf.getvalue()).decode()

        return Response({
            "token": token,
            "expires_at": qr_record.expires_at,
            "student": {"id": student.id, "name": student.full_name},
            "qr_image": f"data:image/png;base64,{qr_b64}",
        })


class QRScanEnrolView(APIView):
    """Driver scans a parent's QR code to enrol a student on their route.

    POST /api/transport/qr/scan/
    Body:
        token    (str) – the token encoded in the QR
        route_id (int) – route the driver is currently operating
        driver_id (int) – DriverProfile id of the scanning driver
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get("token", "").strip()
        route_id = request.data.get("route_id")
        driver_id = request.data.get("driver_id")

        if not token or not route_id or not driver_id:
            return Response(
                {"detail": "token, route_id, and driver_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            qr = StudentBusQRToken.objects.select_related(
                "student", "student__school", "parent"
            ).get(token=token)
        except StudentBusQRToken.DoesNotExist:
            return Response({"detail": "Invalid QR token."}, status=status.HTTP_404_NOT_FOUND)

        if qr.is_used:
            return Response({"detail": "This QR code has already been used."}, status=status.HTTP_400_BAD_REQUEST)
        if qr.expires_at < timezone.now():
            return Response({"detail": "This QR code has expired."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            route = Route.objects.get(id=route_id, school=qr.student.school)
        except Route.DoesNotExist:
            return Response({"detail": "Route not found."}, status=status.HTTP_404_NOT_FOUND)

        from apps.accounts.models import DriverProfile
        try:
            driver = DriverProfile.objects.get(id=driver_id, school=qr.student.school)
        except DriverProfile.DoesNotExist:
            return Response({"detail": "Driver not found."}, status=status.HTTP_404_NOT_FOUND)

        # Deactivate any existing active enrollment for this student
        StudentBusEnrollment.objects.filter(
            student=qr.student, is_active=True
        ).update(is_active=False, deactivated_at=timezone.now())

        enrollment = StudentBusEnrollment.objects.create(
            school=qr.student.school,
            student=qr.student,
            route=route,
            added_by_driver=driver,
        )

        qr.is_used = True
        qr.used_by_driver = driver
        qr.used_at = timezone.now()
        qr.save(update_fields=["is_used", "used_by_driver", "used_at"])

        # Notify parent via SMS
        from common.sms import send_sms
        parent_phone = qr.parent.phone
        if parent_phone:
            send_sms(
                to=parent_phone,
                message=(
                    f"Skippo: {qr.student.full_name} has been added to {route.name} "
                    f"by driver {driver.user.get_full_name() or driver.phone}. "
                    "If you did not request this, contact your school immediately."
                ),
            )

        return Response({
            "detail": "Student enrolled successfully.",
            "student": {"id": qr.student.id, "name": qr.student.full_name},
            "route": {"id": route.id, "name": route.name},
            "enrollment_id": enrollment.id,
        }, status=status.HTTP_201_CREATED)


# ── Parent removes student from bus ──────────────────────────────────────────

class StudentUnenrolRequestView(APIView):
    """Parent initiates removal of their child from a bus route.

    Sends an OTP to the parent's phone for confirmation before the removal is
    committed, preventing accidental or unauthorised deletions.

    POST /api/transport/students/{student_id}/unenroll/
    Body:
        parent_id  (int)
        school_slug (str)
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, student_id: int):
        from apps.accounts.models import OTPRequest
        from apps.accounts.views import _generate_otp, _hash_code, _OTP_TTL_MINUTES
        from datetime import timedelta
        from common.sms import send_sms

        parent_id = request.data.get("parent_id")
        school_slug = request.data.get("school_slug", "").strip()

        if not parent_id or not school_slug:
            return Response(
                {"detail": "parent_id and school_slug are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            student = Student.objects.select_related("school").get(id=student_id)
        except Student.DoesNotExist:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            parent = ParentProfile.objects.get(id=parent_id, school=student.school)
        except ParentProfile.DoesNotExist:
            return Response({"detail": "Parent not found."}, status=status.HTTP_404_NOT_FOUND)

        if not StudentParentLink.objects.filter(student=student, parent=parent).exists():
            return Response(
                {"detail": "This parent is not linked to the student."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not StudentBusEnrollment.objects.filter(student=student, is_active=True).exists():
            return Response(
                {"detail": "Student is not enrolled on any bus."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        code = _generate_otp()
        OTPRequest.objects.create(
            school=student.school,
            contact=parent.phone,
            channel=OTPRequest.Channel.SMS,
            role=OTPRequest.Role.PARENT,
            purpose=OTPRequest.Purpose.CONFIRM_ACTION,
            code_hash=_hash_code(code),
            expires_at=timezone.now() + timedelta(minutes=_OTP_TTL_MINUTES),
            context={"student_id": student_id, "action": "unenroll"},
        )

        send_sms(
            to=parent.phone,
            message=(
                f"Skippo: Your OTP to remove {student.full_name} from the bus is {code}. "
                f"Valid for {_OTP_TTL_MINUTES} minutes. Do not share this code."
            ),
        )

        return Response({"detail": "OTP sent to your registered phone."})


class StudentUnenrolConfirmView(APIView):
    """Confirm removal of a student from their bus route using the OTP.

    POST /api/transport/students/{student_id}/unenroll/confirm/
    Body:
        parent_id  (int)
        school_slug (str)
        code       (str) – the 6-digit OTP received via SMS
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, student_id: int):
        from apps.accounts.views import _hash_code, _OTP_MAX_ATTEMPTS

        parent_id = request.data.get("parent_id")
        code = request.data.get("code", "").strip()

        if not parent_id or not code:
            return Response(
                {"detail": "parent_id and code are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            student = Student.objects.select_related("school").get(id=student_id)
        except Student.DoesNotExist:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            parent = ParentProfile.objects.get(id=parent_id, school=student.school)
        except ParentProfile.DoesNotExist:
            return Response({"detail": "Parent not found."}, status=status.HTTP_404_NOT_FOUND)

        otp = (
            OTPRequest.objects.filter(
                school=student.school,
                contact=parent.phone,
                role=OTPRequest.Role.PARENT,
                purpose=OTPRequest.Purpose.CONFIRM_ACTION,
                is_used=False,
                expires_at__gt=timezone.now(),
                attempts__lt=_OTP_MAX_ATTEMPTS,
                context__student_id=student_id,
            )
            .order_by("-created_at")
            .first()
        )

        if otp is None:
            return Response(
                {"detail": "No valid OTP found. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp.code_hash != _hash_code(code):
            otp.attempts += 1
            otp.save(update_fields=["attempts"])
            return Response({"detail": "Incorrect code."}, status=status.HTTP_400_BAD_REQUEST)

        otp.is_used = True
        otp.save(update_fields=["is_used"])

        updated = StudentBusEnrollment.objects.filter(
            student=student, is_active=True
        ).update(is_active=False, deactivated_at=timezone.now())

        if updated == 0:
            return Response({"detail": "Student was not enrolled on any bus."}, status=status.HTTP_400_BAD_REQUEST)

        from common.sms import send_sms
        send_sms(
            to=parent.phone,
            message=f"Skippo: {student.full_name} has been successfully removed from the bus. Contact your school to re-enroll.",
        )

        return Response({"detail": f"{student.full_name} has been removed from the bus."})


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
