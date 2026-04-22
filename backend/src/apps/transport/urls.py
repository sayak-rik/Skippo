from django.urls import path

from apps.transport.views import (
    AvailableRoutesView,
    BoardStudentView,
    DriverDashboardView,
    DriverSwitchVehicleView,
    DriverVehicleListView,
    DropStudentView,
    EndTripView,
    NearbyVehiclesView,
    ParentChangeBusView,
    ParentConfirmFirstStopView,
    ParentDriverContactView,
    ParentUpdateStopView,
    QRScanEnrolView,
    StartTripView,
    StudentQRGenerateView,
    StudentStopView,
    StudentUnenrolConfirmView,
    StudentUnenrolRequestView,
    TransportRootView,
)


urlpatterns = [
    # Module health
    path("", TransportRootView.as_view(), name="transport-root"),

    # Driver operational dashboard
    path("driver/dashboard/", DriverDashboardView.as_view(), name="transport-driver-dashboard"),

    # Multi-vehicle management (req 13)
    path("driver/vehicles/", DriverVehicleListView.as_view(), name="transport-driver-vehicles"),
    path("driver/vehicles/<int:vehicle_id>/activate/", DriverSwitchVehicleView.as_view(), name="transport-driver-vehicle-activate"),

    # Trip lifecycle
    path("trips/<int:trip_id>/start/", StartTripView.as_view(), name="transport-trip-start"),
    path("trips/<int:trip_id>/end/", EndTripView.as_view(), name="transport-trip-end"),

    # Student board / drop
    path("trips/<int:trip_id>/students/<int:student_id>/board/", BoardStudentView.as_view(), name="transport-student-board"),
    path("trips/<int:trip_id>/students/<int:student_id>/drop/",  DropStudentView.as_view(), name="transport-student-drop"),

    # Parent bus assignment (req 3)
    path("parent/routes/",      AvailableRoutesView.as_view(), name="transport-available-routes"),
    path("parent/change-bus/",  ParentChangeBusView.as_view(), name="transport-parent-change-bus"),

    # Driver contact for parent (req 4)
    path("parent/driver-contact/", ParentDriverContactView.as_view(), name="transport-parent-driver-contact"),

    # Stop override (req 7 & 8)
    path("parent/update-stop/",    ParentUpdateStopView.as_view(),       name="transport-parent-update-stop"),
    path("parent/confirm-stop/",   ParentConfirmFirstStopView.as_view(), name="transport-parent-confirm-stop"),
    path("students/<int:student_id>/stop/", StudentStopView.as_view(),   name="transport-student-stop"),

    # Nearby vehicles for breakdown assistance (req 12)
    path("nearby-vehicles/", NearbyVehiclesView.as_view(), name="transport-nearby-vehicles"),

    # QR-code bus enrolment
    path("students/<int:student_id>/qr/",                StudentQRGenerateView.as_view(),   name="transport-student-qr"),
    path("qr/scan/",                                      QRScanEnrolView.as_view(),         name="transport-qr-scan"),

    # Parent-initiated bus removal (OTP confirmed)
    path("students/<int:student_id>/unenroll/",           StudentUnenrolRequestView.as_view(),  name="transport-student-unenroll"),
    path("students/<int:student_id>/unenroll/confirm/",   StudentUnenrolConfirmView.as_view(),  name="transport-student-unenroll-confirm"),
]
