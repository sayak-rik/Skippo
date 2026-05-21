from django.urls import path

from apps.academics.views import (
    AcademicsRootView,
    AddStudentCommentView,
    AdminClassroomListView,
    AdminStudentListView,
    AIClassSummaryView,
    AILessonPlanView,
    AITokenStatusView,
    AIVoiceObservationView,
    AssistRequestListView,
    ClassBroadcastView,
    ClassRosterView,
    ClassroomListView,
    MarkAttendanceView,
    ParentStudentReportView,
    ResolveAssistRequestView,
    SchedulePreferencesView,
    TeacherDashboardView,
    TeacherScheduleView,
)

urlpatterns = [
    # Module health
    path("", AcademicsRootView.as_view(), name="academics-root"),

    # Teacher schedule & dashboard
    path("teacher/dashboard/",  TeacherDashboardView.as_view(), name="academics-teacher-dashboard"),
    path("teacher/schedule/",   TeacherScheduleView.as_view(),  name="academics-teacher-schedule"),

    # Class picker – list all classrooms for manual override
    path("teacher/classrooms/", ClassroomListView.as_view(), name="academics-classroom-list"),

    # First-week schedule preferences
    path("teacher/schedule-preferences/", SchedulePreferencesView.as_view(), name="academics-schedule-preferences"),

    # Per-session roster
    path(
        "teacher/sessions/<int:class_session_id>/roster/",
        ClassRosterView.as_view(),
        name="academics-class-roster",
    ),

    # Attendance marking (present or absent)
    path(
        "teacher/sessions/<int:class_session_id>/students/<int:student_id>/attendance/",
        MarkAttendanceView.as_view(),
        name="academics-mark-attendance",
    ),

    # Per-student progress notes
    path(
        "teacher/sessions/<int:class_session_id>/students/<int:student_id>/comments/",
        AddStudentCommentView.as_view(),
        name="academics-add-comment",
    ),

    # Class-wide broadcasts (GET history / POST send)
    path(
        "teacher/sessions/<int:class_session_id>/broadcast/",
        ClassBroadcastView.as_view(),
        name="academics-class-broadcast",
    ),

    # Assist requests raised by parents
    path(
        "teacher/sessions/<int:class_session_id>/assist-requests/",
        AssistRequestListView.as_view(),
        name="academics-assist-request-list",
    ),
    path(
        "teacher/assist-requests/<int:request_id>/resolve/",
        ResolveAssistRequestView.as_view(),
        name="academics-resolve-assist-request",
    ),

    # Parent-facing report
    path(
        "parent/students/<int:student_id>/report/",
        ParentStudentReportView.as_view(),
        name="academics-parent-student-report",
    ),

    # Admin — classroom + student management
    path("admin/classrooms/", AdminClassroomListView.as_view(), name="academics-admin-classrooms"),
    path("admin/students/",   AdminStudentListView.as_view(),   name="academics-admin-students"),

    # AI Teaching Assistant
    path("teacher/ai/tokens/",              AITokenStatusView.as_view(),       name="ai-token-status"),
    path("teacher/ai/lesson-plan/",         AILessonPlanView.as_view(),        name="ai-lesson-plan"),
    path("teacher/ai/class-summary/",       AIClassSummaryView.as_view(),      name="ai-class-summary"),
    path("teacher/ai/voice-observation/",   AIVoiceObservationView.as_view(),  name="ai-voice-observation"),
]
