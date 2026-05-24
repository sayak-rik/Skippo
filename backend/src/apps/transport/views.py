import base64
import io
import secrets
from datetime import timedelta

import qrcode
from django.db import models
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import OTPRequest, ParentProfile
from apps.academics.models import Student, StudentParentLink
from apps.transport.models import (
    DriverVehicleAssignment,
    Route,
    StudentBusEnrollment,
    StudentBusQRToken,
    StudentStopOverride,
    Trip,
    TripLocationPing,
    Vehicle,
)


class TransportRootView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"module": "transport", "status": "ready", "mode": "live"})


class DriverDashboardView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from apps.accounts.models import DriverProfile

        driver = None
        if request.user and request.user.is_authenticated:
            driver = (
                DriverProfile.objects.filter(user=request.user)
                .select_related("school")
                .first()
            )

        if not driver:
            return Response({"trip": None, "roster": [], "vehicles": []})

        active_trip = (
            Trip.objects.filter(driver=driver, status="active")
            .select_related("route", "vehicle")
            .first()
        )

        trip_data = None
        roster = []

        if active_trip:
            trip_data = {
                "id": active_trip.id,
                "routeName": active_trip.route.name if active_trip.route else "",
                "busLabel": active_trip.vehicle.registration_number
                if active_trip.vehicle
                else "",
                "status": active_trip.status,
                "boardedCount": active_trip.boarded_count,
                "totalCount": active_trip.total_count,
            }

            enrollments = StudentBusEnrollment.objects.filter(
                route=active_trip.route, is_active=True
            ).select_related("student__classroom")

            for e in enrollments:
                stop = (
                    StudentStopOverride.objects.filter(student=e.student)
                    .order_by("-created_at")
                    .first()
                )
                roster.append(
                    {
                        "id": e.student.id,
                        "name": e.student.full_name,
                        "stopName": stop.stop_name if stop else "",
                        "latitude": float(stop.latitude) if stop else None,
                        "longitude": float(stop.longitude) if stop else None,
                    }
                )

        vehicles = []
        for a in DriverVehicleAssignment.objects.filter(
            driver=driver, is_active=True
        ).select_related("vehicle"):
            vehicles.append(
                {
                    "id": a.vehicle.id,
                    "label": a.vehicle.registration_number,
                    "type": a.vehicle.vehicle_type,
                    "isActive": True,
                }
            )

        return Response({"trip": trip_data, "roster": roster, "vehicles": vehicles})


class StartTripView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, trip_id: int):
        trip = Trip.objects.filter(id=trip_id).first()
        if not trip:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)
        trip.status = Trip.Status.ACTIVE
        trip.started_at = timezone.now()
        trip.save()
        return Response({"trip": {"id": trip.id, "status": trip.status}})


class EndTripView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, trip_id: int):
        trip = Trip.objects.filter(id=trip_id).first()
        if not trip:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)
        trip.status = Trip.Status.COMPLETED
        trip.ended_at = timezone.now()
        trip.save()
        return Response({"trip": {"id": trip.id, "status": trip.status}})


class BoardStudentView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, trip_id: int, student_id: int):
        trip = Trip.objects.filter(id=trip_id).first()
        if not trip:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)
        student = Student.objects.filter(id=student_id).first()
        if not student:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)
        trip.boarded_count = models.F("boarded_count") + 1
        trip.save(update_fields=["boarded_count"])
        return Response(
            {"trip_id": trip_id, "student": {"id": student.id, "name": student.full_name}}
        )


class DropStudentView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, trip_id: int, student_id: int):
        trip = Trip.objects.filter(id=trip_id).first()
        if not trip:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)
        student = Student.objects.filter(id=student_id).first()
        if not student:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(
            {"trip_id": trip_id, "student": {"id": student.id, "name": student.full_name}}
        )


# ── Route / bus management (req 3) ───────────────────────────────────────────

class AvailableRoutesView(APIView):
    """List routes that have at least one active driver assigned (req 3).

    GET /api/transport/parent/routes/
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        routes = (
            Route.objects
            .filter(vehicle__isnull=False, vehicle__drivervehicleassignment__is_active=True)
            .distinct()
            .prefetch_related("stops")
            .select_related("vehicle")
        )
        results = []
        for r in routes:
            assignment = (
                DriverVehicleAssignment.objects
                .filter(vehicle=r.vehicle, is_active=True)
                .select_related("driver__user")
                .first()
            )
            driver_name = ""
            if assignment and assignment.driver:
                driver_name = assignment.driver.user.get_full_name() or assignment.contact_phone or ""
            stops_qs = r.stops.all().order_by("sequence")
            results.append(
                {
                    "id": r.id,
                    "name": r.name,
                    "busLabel": r.vehicle.registration_number if r.vehicle else "",
                    "vehicleId": r.vehicle.id if r.vehicle else None,
                    "driverName": driver_name,
                    "stops": [s.name for s in stops_qs],
                }
            )
        return Response({"results": results})


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

        route = Route.objects.filter(id=int(route_id)).first()
        if route is None:
            return Response({"detail": "Route not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user and request.user.is_authenticated:
            try:
                parent = ParentProfile.objects.get(user=request.user)
                link = (
                    StudentParentLink.objects.filter(parent=parent)
                    .select_related("student")
                    .first()
                )
                if link:
                    StudentBusEnrollment.objects.filter(
                        student=link.student, is_active=True
                    ).update(is_active=False)
                    StudentBusEnrollment.objects.create(
                        school=parent.school, student=link.student, route=route
                    )
            except ParentProfile.DoesNotExist:
                pass

        return Response({"routeId": route.id, "routeName": route.name})


# ── Driver contact (req 4) ────────────────────────────────────────────────────

class ParentDriverContactView(APIView):
    """Return the current trip driver's name and phone (req 4).

    GET /api/transport/parent/driver-contact/
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if request.user and request.user.is_authenticated:
            try:
                parent = ParentProfile.objects.get(user=request.user)
                link = (
                    StudentParentLink.objects.filter(parent=parent)
                    .select_related("student")
                    .first()
                )
                if link:
                    enrollment = (
                        StudentBusEnrollment.objects.filter(
                            student=link.student, is_active=True
                        )
                        .select_related("route")
                        .first()
                    )
                    if enrollment:
                        active_trip = (
                            Trip.objects.filter(
                                route=enrollment.route, status="active"
                            )
                            .select_related("driver__user", "vehicle")
                            .first()
                        )
                        if active_trip and active_trip.driver:
                            assignment = DriverVehicleAssignment.objects.filter(
                                driver=active_trip.driver,
                                vehicle=active_trip.vehicle,
                                is_active=True,
                            ).first()
                            return Response(
                                {
                                    "name": active_trip.driver.user.get_full_name(),
                                    "phone": assignment.contact_phone
                                    if assignment
                                    else active_trip.driver.phone,
                                    "vehicleLabel": active_trip.vehicle.registration_number
                                    if active_trip.vehicle
                                    else "",
                                    "routeName": enrollment.route.name,
                                }
                            )
            except ParentProfile.DoesNotExist:
                pass

        return Response({"name": "", "phone": "", "vehicleLabel": "", "routeName": ""})


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

        student = Student.objects.filter(id=int(student_id)).first()
        if not student:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        StudentStopOverride.objects.filter(student=student).delete()
        override = StudentStopOverride.objects.create(
            school=student.school,
            student=student,
            stop_name=stop_name,
            latitude=float(latitude),
            longitude=float(longitude),
            confirmed_by_parent=True,
        )

        return Response(
            {
                "stopName": override.stop_name,
                "latitude": float(override.latitude),
                "longitude": float(override.longitude),
                "confirmedByParent": override.confirmed_by_parent,
            }
        )


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

        student = Student.objects.filter(id=int(student_id)).first()
        if not student:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        updated = StudentStopOverride.objects.filter(
            student=student, confirmed_by_parent=False
        ).update(confirmed_by_parent=True)

        if not updated:
            return Response(
                {"detail": "No pending stop to confirm."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({"detail": "Stop confirmed."})


class StudentStopView(APIView):
    """Return the current stop override for a student, if any.

    GET /api/transport/students/{student_id}/stop/
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, student_id: int):
        override = (
            StudentStopOverride.objects.filter(student_id=student_id)
            .order_by("-created_at")
            .first()
        )
        if not override:
            return Response({"stopOverride": None})
        return Response(
            {
                "stopOverride": {
                    "stopName": override.stop_name,
                    "latitude": float(override.latitude),
                    "longitude": float(override.longitude),
                    "confirmedByParent": override.confirmed_by_parent,
                    "confirmedByDriver": override.confirmed_by_driver,
                }
            }
        )


# ── Nearby vehicles for breakdown (req 12) ────────────────────────────────────

class NearbyVehiclesView(APIView):
    """Return nearby school vehicles the driver can contact during a breakdown (req 12).

    GET /api/transport/nearby-vehicles/
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        vehicles = Vehicle.objects.all()[:10]
        results = [
            {"id": v.id, "label": v.registration_number, "type": v.vehicle_type}
            for v in vehicles
        ]
        return Response({"results": results})


# ── QR-code bus enrolment ─────────────────────────────────────────────────────

class StudentQRGenerateView(APIView):
    """Generate a single-use QR token for enrolling a student on a bus.

    GET /api/transport/students/{student_id}/qr/
    Derives parent from the authenticated user; falls back to ?parent_id for
    legacy callers.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, student_id: int):
        # Derive parent from auth user when available
        if request.user and request.user.is_authenticated:
            try:
                parent = ParentProfile.objects.get(user=request.user)
            except ParentProfile.DoesNotExist:
                return Response({"detail": "Parent profile not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            parent_id = request.query_params.get("parent_id")
            if not parent_id:
                return Response({"detail": "Authentication or parent_id required."}, status=status.HTTP_401_UNAUTHORIZED)
            try:
                parent = ParentProfile.objects.get(id=parent_id)
            except ParentProfile.DoesNotExist:
                return Response({"detail": "Parent not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            student = Student.objects.select_related("school").get(id=student_id)
        except Student.DoesNotExist:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

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


# ── Parent enrollment status ──────────────────────────────────────────────────

class ParentEnrollmentStatusView(APIView):
    """Return the current bus enrollment(s) for the authenticated parent's children.

    GET /api/transport/parent/enrollment/
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if not (request.user and request.user.is_authenticated):
            return Response({"enrollments": []})

        try:
            parent = ParentProfile.objects.get(user=request.user)
        except ParentProfile.DoesNotExist:
            return Response({"enrollments": []})

        links = StudentParentLink.objects.filter(parent=parent).select_related("student")
        enrollments = []
        for link in links:
            enrollment = (
                StudentBusEnrollment.objects
                .filter(student=link.student, is_active=True)
                .select_related("route__vehicle", "added_by_driver__user")
                .first()
            )
            if enrollment:
                driver_name = ""
                if enrollment.added_by_driver:
                    driver_name = (
                        enrollment.added_by_driver.user.get_full_name()
                        or enrollment.added_by_driver.phone
                    )
                if not driver_name and enrollment.route.vehicle:
                    assignment = DriverVehicleAssignment.objects.filter(
                        vehicle=enrollment.route.vehicle, is_active=True
                    ).select_related("driver__user").first()
                    if assignment and assignment.driver:
                        driver_name = assignment.driver.user.get_full_name() or ""

                enrollments.append({
                    "student_id": link.student.id,
                    "student_name": link.student.full_name,
                    "route_id": enrollment.route.id,
                    "route_name": enrollment.route.name,
                    "bus_label": enrollment.route.vehicle.registration_number if enrollment.route.vehicle else "",
                    "driver_name": driver_name,
                    "driver_confirmed": enrollment.added_by_driver is not None,
                })
            else:
                enrollments.append({
                    "student_id": link.student.id,
                    "student_name": link.student.full_name,
                    "route_id": None,
                    "route_name": None,
                    "bus_label": None,
                    "driver_name": None,
                    "driver_confirmed": False,
                })

        return Response({"enrollments": enrollments})


# ── Parent direct unenroll ────────────────────────────────────────────────────

class ParentDirectUnenrollView(APIView):
    """Remove a student from their bus route (authenticated parent, no OTP).

    POST /api/transport/parent/unenroll/
    Body: { "student_id": 1 }
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not (request.user and request.user.is_authenticated):
            return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        student_id = request.data.get("student_id")
        if not student_id:
            return Response({"detail": "student_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            parent = ParentProfile.objects.get(user=request.user)
        except ParentProfile.DoesNotExist:
            return Response({"detail": "Parent profile not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            student = Student.objects.get(id=int(student_id), school=parent.school)
        except Student.DoesNotExist:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        if not StudentParentLink.objects.filter(student=student, parent=parent).exists():
            return Response({"detail": "Not linked to this student."}, status=status.HTTP_403_FORBIDDEN)

        updated = StudentBusEnrollment.objects.filter(
            student=student, is_active=True
        ).update(is_active=False, deactivated_at=timezone.now())

        return Response({
            "detail": f"{student.full_name} has been removed from the bus.",
            "removed": updated > 0,
        })


# ── Multi-vehicle switcher (req 13) ──────────────────────────────────────────

class DriverVehicleListView(APIView):
    """List all vehicles assigned to the current driver (req 13).

    GET /api/transport/driver/vehicles/
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if not (request.user and request.user.is_authenticated):
            return Response({"results": []})

        from apps.accounts.models import DriverProfile
        try:
            driver = DriverProfile.objects.get(user=request.user)
            assignments = DriverVehicleAssignment.objects.filter(
                driver=driver, is_active=True
            ).select_related("vehicle")
            results = [
                {"id": a.vehicle.id, "label": a.vehicle.registration_number, "isActive": True}
                for a in assignments
            ]
            return Response({"results": results})
        except DriverProfile.DoesNotExist:
            return Response({"results": []})


class DriverSwitchVehicleView(APIView):
    """Switch the driver's active vehicle (req 13).

    POST /api/transport/driver/vehicles/{vehicle_id}/activate/
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, vehicle_id: int):
        vehicle = Vehicle.objects.filter(id=vehicle_id).first()
        if vehicle is None:
            return Response({"detail": "Vehicle not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(
            {"activeVehicle": {"id": vehicle.id, "label": vehicle.registration_number}}
        )


# ── Driver-initiated student removal (parent must confirm via OTP) ────────────

class DriverRequestStudentRemovalView(APIView):
    """Driver requests removal of a student from the route.

    Sends an OTP to the student's linked parent for confirmation.
    The parent must confirm using DriverConfirmStudentRemovalView.

    POST /api/transport/driver/students/<student_id>/request-remove/
    Body: { driver_id (int) }
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, student_id: int):
        from apps.accounts.models import DriverProfile, OTPRequest
        from apps.accounts.views import _generate_otp, _hash_code, _OTP_TTL_MINUTES
        from datetime import timedelta
        from common.sms import send_sms

        driver_id = request.data.get("driver_id")
        if not driver_id:
            return Response({"detail": "driver_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = Student.objects.select_related("school").get(id=student_id)
        except Student.DoesNotExist:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            driver = DriverProfile.objects.get(id=driver_id, school=student.school)
        except DriverProfile.DoesNotExist:
            return Response({"detail": "Driver not found or not in same school."}, status=status.HTTP_404_NOT_FOUND)

        if not StudentBusEnrollment.objects.filter(student=student, is_active=True).exists():
            return Response({"detail": "Student is not enrolled on any bus."}, status=status.HTTP_400_BAD_REQUEST)

        # Get the primary linked parent
        link = StudentParentLink.objects.filter(student=student).select_related("parent").first()
        if not link:
            return Response({"detail": "No parent linked to this student."}, status=status.HTTP_400_BAD_REQUEST)

        parent = link.parent
        if not parent.phone:
            return Response({"detail": "Parent has no phone number on file."}, status=status.HTTP_400_BAD_REQUEST)

        code = _generate_otp()
        OTPRequest.objects.create(
            school=student.school,
            contact=parent.phone,
            channel=OTPRequest.Channel.SMS,
            role=OTPRequest.Role.PARENT,
            purpose=OTPRequest.Purpose.CONFIRM_ACTION,
            code_hash=_hash_code(code),
            expires_at=timezone.now() + timedelta(minutes=_OTP_TTL_MINUTES),
            context={"student_id": student_id, "action": "driver_remove", "driver_id": driver_id},
        )

        send_sms(
            to=parent.phone,
            message=(
                f"Skippo: Driver {driver.user.get_full_name() or driver.phone} has requested to "
                f"remove {student.full_name} from the bus. Your confirmation OTP is {code}. "
                f"Valid for {_OTP_TTL_MINUTES} minutes. If you did not request this, ignore this message."
            ),
        )

        return Response({"detail": "OTP sent to parent for confirmation.", "parent_phone_hint": parent.phone[-4:]})


class DriverConfirmStudentRemovalView(APIView):
    """Parent confirms driver-initiated student removal via OTP.

    POST /api/transport/driver/students/<student_id>/confirm-remove/
    Body: { parent_id (int), code (str) }
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, student_id: int):
        from apps.accounts.views import _hash_code, _OTP_MAX_ATTEMPTS
        from common.sms import send_sms

        parent_id = request.data.get("parent_id")
        code = request.data.get("code", "").strip()

        if not parent_id or not code:
            return Response({"detail": "parent_id and code are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = Student.objects.select_related("school").get(id=student_id)
        except Student.DoesNotExist:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            parent = ParentProfile.objects.get(id=parent_id, school=student.school)
        except ParentProfile.DoesNotExist:
            return Response({"detail": "Parent not found."}, status=status.HTTP_404_NOT_FOUND)

        from apps.accounts.models import OTPRequest
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
                context__action="driver_remove",
            )
            .order_by("-created_at")
            .first()
        )

        if otp is None:
            return Response({"detail": "No valid OTP found. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)

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

        send_sms(
            to=parent.phone,
            message=f"Skippo: {student.full_name} has been removed from the bus by the driver. Contact your school to re-enroll.",
        )

        return Response({"detail": f"{student.full_name} has been removed from the bus."})
