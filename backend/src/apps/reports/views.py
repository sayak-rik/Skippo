from rest_framework import permissions, status
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
