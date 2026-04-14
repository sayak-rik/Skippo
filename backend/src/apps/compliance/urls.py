from django.urls import path

from apps.compliance.views import ComplianceRootView, DriverRenewalsView


urlpatterns = [
    path("", ComplianceRootView.as_view(), name="compliance-root"),
    path("driver/renewals/", DriverRenewalsView.as_view(), name="compliance-driver-renewals"),
]
