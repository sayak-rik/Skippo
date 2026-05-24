from django.urls import path

from apps.academics.views import (
    AcademicsRootView,
    AddStudentCommentView,
    AdminAcademicEventDetailView,
    AdminUDISEReportDetailView,
    AdminUDISEReportListView,
    AdminAcademicEventListView,
    AdminAcademicSessionDetailView,
    AdminAcademicSessionListView,
    AdminAcademicYearDetailView,
    AdminAcademicYearListView,
    AdminAcademicYearSetCurrentView,
    AdminClassroomListView,
    AdminExamDetailView,
    AdminExamListView,
    AdminExamPublishView,
    AdminExamResultsView,
    AdminExamScheduleDetailView,
    AdminExamScheduleListView,
    AdminHolidayDetailView,
    AdminHolidayListView,
    AdminHomeworkDetailView,
    AdminHomeworkListView,
    AdminHouseDetailView,
    AdminHouseListView,
    AdminParentInviteView,
    AdminReportCardGenerateView,
    AdminReportCardListView,
    AdminReportCardPublishView,
    AdminStudentCreateView,
    AdminStudentDetailView,
    AdminStudentDocumentDetailView,
    AdminStudentDocumentListView,
    AdminStudentImportView,
    AdminStudentListView,
    AdminStudentPromoteView,
    AdminSubjectDetailView,
    AdminSubjectListView,
    AdminTimetableDetailView,
    AdminTimetableListView,
    AdminTimetableSlotBulkView,
    AdminTransferCertificateListView,
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
    path("admin/classrooms/",              AdminClassroomListView.as_view(),  name="academics-admin-classrooms"),
    path("admin/students/",                AdminStudentListView.as_view(),    name="academics-admin-students"),
    path("admin/students/new/",            AdminStudentCreateView.as_view(),  name="academics-admin-students-create"),
    path("admin/students/import/",         AdminStudentImportView.as_view(),  name="academics-admin-students-import"),
    path("admin/students/send-invites/",   AdminParentInviteView.as_view(),   name="academics-admin-send-invites"),
    path("admin/students/promote/",        AdminStudentPromoteView.as_view(), name="academics-admin-students-promote"),
    path("admin/students/<int:student_id>/",                          AdminStudentDetailView.as_view(),       name="academics-admin-student-detail"),
    path("admin/students/<int:student_id>/documents/",                AdminStudentDocumentListView.as_view(), name="academics-admin-student-docs"),
    path("admin/students/<int:student_id>/documents/<int:doc_id>/",   AdminStudentDocumentDetailView.as_view(), name="academics-admin-student-doc-detail"),
    path("admin/transfer-certificates/",   AdminTransferCertificateListView.as_view(), name="academics-admin-tcs"),

    # Admin — academic years & sessions
    path("admin/academic-years/",                                                   AdminAcademicYearListView.as_view(),      name="academics-admin-years"),
    path("admin/academic-years/<int:year_id>/",                                     AdminAcademicYearDetailView.as_view(),    name="academics-admin-year-detail"),
    path("admin/academic-years/<int:year_id>/set-current/",                         AdminAcademicYearSetCurrentView.as_view(),name="academics-admin-year-set-current"),
    path("admin/academic-years/<int:year_id>/sessions/",                            AdminAcademicSessionListView.as_view(),   name="academics-admin-sessions"),
    path("admin/academic-years/<int:year_id>/sessions/<int:session_id>/",           AdminAcademicSessionDetailView.as_view(), name="academics-admin-session-detail"),

    # Admin — subjects
    path("admin/subjects/",                AdminSubjectListView.as_view(),    name="academics-admin-subjects"),
    path("admin/subjects/<int:subject_id>/", AdminSubjectDetailView.as_view(), name="academics-admin-subject-detail"),

    # Admin — houses / groups
    path("admin/houses/",                  AdminHouseListView.as_view(),      name="academics-admin-houses"),
    path("admin/houses/<int:house_id>/",   AdminHouseDetailView.as_view(),    name="academics-admin-house-detail"),

    # Admin — academic calendar: holidays & events
    path("admin/holidays/",                AdminHolidayListView.as_view(),    name="academics-admin-holidays"),
    path("admin/holidays/<int:holiday_id>/", AdminHolidayDetailView.as_view(), name="academics-admin-holiday-detail"),
    path("admin/academic-events/",                  AdminAcademicEventListView.as_view(),  name="academics-admin-events"),
    path("admin/academic-events/<int:event_id>/",   AdminAcademicEventDetailView.as_view(), name="academics-admin-event-detail"),

    # Admin — timetables
    path("admin/timetables/",                                              AdminTimetableListView.as_view(),     name="academics-admin-timetables"),
    path("admin/timetables/<int:timetable_id>/",                           AdminTimetableDetailView.as_view(),   name="academics-admin-timetable-detail"),
    path("admin/timetables/<int:timetable_id>/slots/",                     AdminTimetableSlotBulkView.as_view(), name="academics-admin-timetable-slots"),

    # Admin — homework
    path("admin/homework/",                  AdminHomeworkListView.as_view(),   name="academics-admin-homework"),
    path("admin/homework/<int:homework_id>/", AdminHomeworkDetailView.as_view(), name="academics-admin-homework-detail"),

    # Admin — exams
    path("admin/exams/",                     AdminExamListView.as_view(),       name="academics-admin-exams"),
    path("admin/exams/<int:exam_id>/",       AdminExamDetailView.as_view(),     name="academics-admin-exam-detail"),
    path("admin/exams/<int:exam_id>/publish/", AdminExamPublishView.as_view(),  name="academics-admin-exam-publish"),

    # Admin — exam schedules
    path("admin/exams/<int:exam_id>/schedules/",                                AdminExamScheduleListView.as_view(),   name="academics-admin-exam-schedules"),
    path("admin/exams/<int:exam_id>/schedules/<int:schedule_id>/",              AdminExamScheduleDetailView.as_view(), name="academics-admin-exam-schedule-detail"),

    # Admin — marks entry (bulk upsert per schedule)
    path("admin/exam-schedules/<int:schedule_id>/results/",                     AdminExamResultsView.as_view(),        name="academics-admin-exam-results"),

    # Admin — report cards
    path("admin/exams/<int:exam_id>/report-cards/generate/",                    AdminReportCardGenerateView.as_view(), name="academics-admin-report-cards-generate"),
    path("admin/exams/<int:exam_id>/report-cards/publish/",                     AdminReportCardPublishView.as_view(),  name="academics-admin-report-card-publish"),
    path("admin/report-cards/",                                                 AdminReportCardListView.as_view(),     name="academics-admin-report-cards"),

    # Admin — UDISE reports
    path("admin/udise/",                    AdminUDISEReportListView.as_view(),   name="academics-admin-udise"),
    path("admin/udise/<int:report_id>/",    AdminUDISEReportDetailView.as_view(), name="academics-admin-udise-detail"),

    # AI Teaching Assistant
    path("teacher/ai/tokens/",              AITokenStatusView.as_view(),       name="ai-token-status"),
    path("teacher/ai/lesson-plan/",         AILessonPlanView.as_view(),        name="ai-lesson-plan"),
    path("teacher/ai/class-summary/",       AIClassSummaryView.as_view(),      name="ai-class-summary"),
    path("teacher/ai/voice-observation/",   AIVoiceObservationView.as_view(),  name="ai-voice-observation"),
]
