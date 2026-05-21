from django.urls import path

from apps.tenancy.views import (
    AdminOverviewView,
    RegistrationInterestCreateView,
    RegistrationInterestListView,
    SchoolProvisionView,
    StaffManagementView,
)

urlpatterns = [
    # Public — website contact form submits here
    path("interests/",                   RegistrationInterestCreateView.as_view(), name="tenancy-interests-create"),

    # Staff + superuser
    path("admin/interests/",             RegistrationInterestListView.as_view(),   name="tenancy-interests-list"),
    path("admin/interests/<int:pk>/",    RegistrationInterestListView.as_view(),   name="tenancy-interests-patch"),
    path("admin/schools/",               SchoolProvisionView.as_view(),            name="tenancy-school-provision"),

    # Superuser only — staff management
    path("admin/staff/",                 StaffManagementView.as_view(),            name="tenancy-staff-list"),
    path("admin/staff/<int:pk>/",        StaffManagementView.as_view(),            name="tenancy-staff-delete"),

    # School admin dashboard overview
    path("school/overview/",             AdminOverviewView.as_view(),              name="tenancy-school-overview"),
]
