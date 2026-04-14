from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from common.demo_state import add_comment, mark_attendance, parent_report, teacher_dashboard


class AcademicsRootView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"module": "academics", "status": "ready", "mode": "demo"})


class TeacherScheduleView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"results": teacher_dashboard()["schedule"]})


class TeacherDashboardView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(teacher_dashboard())


class ClassRosterView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, class_session_id: int):
        dashboard = teacher_dashboard()
        session = next((item for item in dashboard["schedule"] if item["id"] == class_session_id), None)
        if session is None:
            return Response({"detail": "Class session not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(
            {
                "session": session,
                "results": dashboard["roster"],
            }
        )


class MarkAttendanceView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, class_session_id: int, student_id: int):
        result = mark_attendance(class_session_id, student_id)
        if result is None:
            return Response({"detail": "Attendance target not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(result, status=status.HTTP_201_CREATED)


class AddStudentCommentView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, class_session_id: int, student_id: int):
        note = request.data.get("note", "").strip()
        category = request.data.get("category", "teacher_comment")
        if not note:
            return Response({"detail": "A comment is required."}, status=status.HTTP_400_BAD_REQUEST)
        progress = add_comment(class_session_id, student_id, note=note, category=category)
        if progress is None:
            return Response({"detail": "Comment target not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(progress, status=status.HTTP_201_CREATED)


class ParentStudentReportView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, student_id: int):
        return Response(parent_report(student_id))
