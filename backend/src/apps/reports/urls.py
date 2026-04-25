from django.urls import path

from apps.reports.views import (
    ParentDashboardReportView,
    ReportsRootView,
    TeacherEndOfDayView,
    WeeklyDigestLatestView,
    WeeklyDigestListView,
)

urlpatterns = [
    path("", ReportsRootView.as_view(), name="reports-root"),
    path("parent/dashboard/", ParentDashboardReportView.as_view(), name="reports-parent-dashboard"),
    path("teacher/end-of-day/", TeacherEndOfDayView.as_view(), name="reports-teacher-end-of-day"),

    # Weekly AI digest for parents
    path(
        "parent/students/<int:student_id>/weekly-digests/",
        WeeklyDigestListView.as_view(),
        name="reports-weekly-digest-list",
    ),
    path(
        "parent/students/<int:student_id>/weekly-digests/latest/",
        WeeklyDigestLatestView.as_view(),
        name="reports-weekly-digest-latest",
    ),
]
