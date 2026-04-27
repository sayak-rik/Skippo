from django.urls import path

from apps.tenancy.views import (
    RegistrationInterestCreateView,
    RegistrationInterestListView,
    SchoolProvisionView,
)

urlpatterns = [
    # Public — website contact form submits here
    path("interests/",          RegistrationInterestCreateView.as_view(), name="tenancy-interests-create"),

    # Superuser admin
    path("admin/interests/",    RegistrationInterestListView.as_view(),   name="tenancy-interests-list"),
    path("admin/interests/<int:pk>/", RegistrationInterestListView.as_view(), name="tenancy-interests-patch"),
    path("admin/schools/",      SchoolProvisionView.as_view(),            name="tenancy-school-provision"),
]
