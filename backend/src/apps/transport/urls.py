from django.urls import path

from apps.transport.views import (
    BoardStudentView,
    DriverDashboardView,
    DropStudentView,
    EndTripView,
    StartTripView,
    TransportRootView,
)


urlpatterns = [
    path("", TransportRootView.as_view(), name="transport-root"),
    path("driver/dashboard/", DriverDashboardView.as_view(), name="transport-driver-dashboard"),
    path("trips/<int:trip_id>/start/", StartTripView.as_view(), name="transport-trip-start"),
    path("trips/<int:trip_id>/end/", EndTripView.as_view(), name="transport-trip-end"),
    path(
        "trips/<int:trip_id>/students/<int:student_id>/board/",
        BoardStudentView.as_view(),
        name="transport-student-board",
    ),
    path(
        "trips/<int:trip_id>/students/<int:student_id>/drop/",
        DropStudentView.as_view(),
        name="transport-student-drop",
    ),
]
