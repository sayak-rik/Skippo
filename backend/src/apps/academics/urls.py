from django.urls import path

from apps.academics.views import (
    AcademicsRootView,
    AddStudentCommentView,
    ClassRosterView,
    MarkAttendanceView,
    ParentStudentReportView,
    TeacherDashboardView,
    TeacherScheduleView,
)

urlpatterns = [
    path("", AcademicsRootView.as_view(), name="academics-root"),
    path("teacher/dashboard/", TeacherDashboardView.as_view(), name="academics-teacher-dashboard"),
    path("teacher/schedule/", TeacherScheduleView.as_view(), name="academics-teacher-schedule"),
    path("teacher/sessions/<int:class_session_id>/roster/", ClassRosterView.as_view(), name="academics-class-roster"),
    path(
        "teacher/sessions/<int:class_session_id>/students/<int:student_id>/attendance/",
        MarkAttendanceView.as_view(),
        name="academics-mark-attendance",
    ),
    path(
        "teacher/sessions/<int:class_session_id>/students/<int:student_id>/comments/",
        AddStudentCommentView.as_view(),
        name="academics-add-comment",
    ),
    path(
        "parent/students/<int:student_id>/report/",
        ParentStudentReportView.as_view(),
        name="academics-parent-student-report",
    ),
]
