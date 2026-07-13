from django.urls import path

from apps.compliance.views import (
    ComplianceRootView,
    DigiLockerCallbackView,
    DigiLockerInitiateView,
    DigiLockerVerificationListView,
    DriverRenewalsView,
)


urlpatterns = [
    path("", ComplianceRootView.as_view(), name="compliance-root"),
    path("driver/renewals/", DriverRenewalsView.as_view(), name="compliance-driver-renewals"),

    # DigiLocker verification pipeline
    path("digilocker/initiate/",      DigiLockerInitiateView.as_view(),         name="digilocker-initiate"),
    path("digilocker/callback/",      DigiLockerCallbackView.as_view(),         name="digilocker-callback"),
    path("digilocker/verifications/", DigiLockerVerificationListView.as_view(), name="digilocker-verifications"),
]
