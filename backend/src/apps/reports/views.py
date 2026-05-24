from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.accounts.models import ParentProfile
from apps.academics.models import (
    ClassSession,
    StudentDailyReport,
    StudentParentLink,
    StudentProgress,
)
from apps.communications.models import MessageReceipt
from apps.notifications.models import EmergencyEvent
from apps.transport.models import (
    DriverVehicleAssignment,
    StudentBusEnrollment,
    StudentStopOverride,
)
from apps.tracking.models import LiveLocation, Trip


class ReportsRootView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"module": "reports", "status": "ready", "mode": "live"})


class ParentDashboardReportView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Get parent + their first linked student
        try:
            parent = (
                ParentProfile.objects
                .select_related("school", "user")
                .get(user=request.user)
            )
        except ParentProfile.DoesNotExist:
            return Response({"detail": "Parent profile not found."}, status=status.HTTP_404_NOT_FOUND)

        student_link = (
            StudentParentLink.objects
            .filter(parent=parent)
            .select_related("student__classroom")
            .first()
        )
        student = student_link.student if student_link else None

        # Active trip for student's enrolled route
        trip_data = None
        driver_contact = None
        enrollment = None
        if student:
            enrollment = (
                StudentBusEnrollment.objects
                .filter(student=student, is_active=True)
                .select_related("route__vehicle")
                .first()
            )
            if enrollment:
                active_trip = (
                    Trip.objects
                    .filter(route=enrollment.route, status="active")
                    .select_related("vehicle", "driver__user")
                    .first()
                )
                if active_trip:
                    latest_ping = (
                        LiveLocation.objects
                        .filter(trip=active_trip)
                        .order_by("-created_at")
                        .first()
                    )
                    trip_data = {
                        "id": active_trip.id,
                        "routeName": enrollment.route.name,
                        "busLabel": active_trip.vehicle.registration_number if active_trip.vehicle else "",
                        "etaMinutes": 0,
                        "status": active_trip.status,
                        "busLocation": {
                            "latitude": float(latest_ping.latitude),
                            "longitude": float(latest_ping.longitude),
                            "speed": float(latest_ping.speed) if latest_ping.speed is not None else 0,
                            "heading": float(latest_ping.heading) if latest_ping.heading is not None else 0,
                            "updatedAt": str(latest_ping.created_at),
                        } if latest_ping else None,
                    }
                    if active_trip.driver:
                        assignment = (
                            DriverVehicleAssignment.objects
                            .filter(driver=active_trip.driver, vehicle=active_trip.vehicle, is_active=True)
                            .first()
                        )
                        driver_contact = {
                            "name": active_trip.driver.user.get_full_name(),
                            "phone": (assignment.contact_phone if assignment else active_trip.driver.phone),
                            "vehicleLabel": active_trip.vehicle.registration_number if active_trip.vehicle else "",
                            "routeName": enrollment.route.name,
                        }

        # Progress notes (last 20)
        progress = []
        if student:
            for p in (
                StudentProgress.objects
                .filter(student=student)
                .select_related("teacher__user")
                .order_by("-created_at")[:20]
            ):
                progress.append({
                    "id": p.id,
                    "title": p.category.replace("_", " ").title(),
                    "note": p.note,
                    "category": p.category,
                    "createdAt": str(p.created_at),
                    "isReadByParent": p.is_read_by_parent,
                })

        # Daily reports (last 7)
        daily_reports = []
        if student:
            for r in StudentDailyReport.objects.filter(student=student).order_by("-date")[:7]:
                daily_reports.append({
                    "id": r.id,
                    "date": str(r.date),
                    "attendanceSummary": r.attendance_summary,
                    "teacherCommentSummary": r.teacher_comment_summary,
                    "unreadCommentCount": r.unread_comment_count,
                })

        # Messages for this parent
        messages = []
        for receipt in (
            MessageReceipt.objects
            .filter(user=request.user, school=parent.school)
            .select_related("campaign")
            .order_by("-created_at")[:20]
        ):
            messages.append({
                "id": receipt.id,
                "title": receipt.campaign.title,
                "body": receipt.campaign.body,
                "tag": receipt.campaign.category,
                "createdAt": str(receipt.created_at),
                "isRead": receipt.is_read,
            })

        # Alerts for school
        alerts = []
        for e in EmergencyEvent.objects.filter(school=parent.school).order_by("-created_at")[:10]:
            alerts.append({
                "id": e.id,
                "title": f"Emergency: {e.status}",
                "body": "",
                "level": "critical",
                "createdAt": str(e.created_at),
            })

        # Student shape
        student_data = None
        if student:
            stop_override = (
                StudentStopOverride.objects
                .filter(student=student)
                .order_by("-created_at")
                .first()
            )
            student_data = {
                "id": student.id,
                "name": student.full_name,
                "grade": student.classroom.name if student.classroom else "",
                "routeName": enrollment.route.name if enrollment else "",
                "stopName": stop_override.stop_name if stop_override else "",
                "routeId": enrollment.route.id if enrollment else None,
            }

        return Response({
            "student": student_data,
            "trip": trip_data,
            "progress": progress,
            "dailyReports": daily_reports,
            "messages": messages,
            "alerts": alerts,
            "driverContact": driver_contact,
        })


class TeacherEndOfDayView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        today = timezone.now().date()
        school_slug = request.query_params.get("school_slug", "").strip()

        # Attempt to resolve school from slug query param or skip filtering by school
        from apps.tenancy.models import School
        school = None
        if school_slug:
            school = School.objects.filter(slug=school_slug, is_active=True).first()

        qs = ClassSession.objects.filter(
            weekday=today.isoweekday(),
            is_active=True,
        ).select_related("classroom")
        if school:
            qs = qs.filter(school=school)

        sessions = qs.order_by("starts_at")[:10]
        results = [
            {
                "id": s.id,
                "title": s.title,
                "classroom": s.classroom.name,
                "startsAt": str(s.starts_at),
                "endsAt": str(s.ends_at),
            }
            for s in sessions
        ]
        return Response({"results": results})


# ── Weekly digest ─────────────────────────────────────────────────────────────

class WeeklyDigestListView(APIView):
    """Return the last N weekly digests for a student.

    GET /api/reports/parent/students/<student_id>/weekly-digests/?limit=4
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, student_id: int):
        from apps.reports.models import WeeklyStudentDigest

        limit = int(request.query_params.get("limit", 4))
        digests = WeeklyStudentDigest.objects.filter(student_id=student_id).order_by("-week_start")[:limit]

        results = [
            {
                "id": d.pk,
                "week_start": str(d.week_start),
                "days_present": d.days_present,
                "days_absent": d.days_absent,
                "attendance_pct": d.attendance_pct,
                "strengths_summary": d.strengths_summary,
                "weaknesses_summary": d.weaknesses_summary,
                "teacher_highlights": d.teacher_highlights,
                "overall_summary": d.overall_summary,
            }
            for d in digests
        ]
        return Response({"results": results})


class WeeklyDigestLatestView(APIView):
    """Return the most recent weekly digest for a student."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, student_id: int):
        from apps.reports.models import WeeklyStudentDigest

        digest = WeeklyStudentDigest.objects.filter(student_id=student_id).order_by("-week_start").first()
        if not digest:
            return Response({"detail": "No digest available yet."}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "id": digest.pk,
            "week_start": str(digest.week_start),
            "days_present": digest.days_present,
            "days_absent": digest.days_absent,
            "attendance_pct": digest.attendance_pct,
            "strengths_summary": digest.strengths_summary,
            "weaknesses_summary": digest.weaknesses_summary,
            "teacher_highlights": digest.teacher_highlights,
            "overall_summary": digest.overall_summary,
        })
