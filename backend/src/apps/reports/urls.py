from django.urls import path

from apps.reports.views import ParentDashboardReportView, ReportsRootView, TeacherEndOfDayView


urlpatterns = [
    path("", ReportsRootView.as_view(), name="reports-root"),
    path("parent/dashboard/", ParentDashboardReportView.as_view(), name="reports-parent-dashboard"),
    path("teacher/end-of-day/", TeacherEndOfDayView.as_view(), name="reports-teacher-end-of-day"),
]
