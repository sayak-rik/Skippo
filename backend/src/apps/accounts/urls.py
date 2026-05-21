from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.views import (
    AcceptDriverInviteView,
    AcceptInviteView,
    AccountsRootView,
    AdminLoginView,
    AdminTeacherListView,
    CreateTeacherInviteView,
    DemoLoginView,
    DriverSelfSignupView,
    MeView,
    OTPRequestView,
    OTPVerifyView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    ValidateDriverInviteView,
    ValidateInviteView,
)

urlpatterns = [
    # Module health
    path("", AccountsRootView.as_view(), name="accounts-root"),

    # Staff / superuser login (email + password → JWT)
    path("admin/login/", AdminLoginView.as_view(), name="accounts-admin-login"),

    # Demo auth
    path("demo-login/", DemoLoginView.as_view(), name="accounts-demo-login"),
    path("me/",         MeView.as_view(),         name="accounts-me"),

    # Teacher invite flow
    path("teacher/invite/<str:token>/", ValidateInviteView.as_view(), name="accounts-validate-invite"),
    path("teacher/accept-invite/",      AcceptInviteView.as_view(),   name="accounts-accept-invite"),

    # Driver invite flow (req 6) — invited drivers bypass approval queue
    path("driver/invite/<str:token>/", ValidateDriverInviteView.as_view(), name="accounts-validate-driver-invite"),
    path("driver/accept-invite/",      AcceptDriverInviteView.as_view(),   name="accounts-accept-driver-invite"),

    # Driver self-signup (req 6) — no invite; waits for admin approval
    path("driver/signup/", DriverSelfSignupView.as_view(), name="accounts-driver-signup"),

    # OTP login (parent & driver)
    path("otp/request/", OTPRequestView.as_view(), name="accounts-otp-request"),
    path("otp/verify/",  OTPVerifyView.as_view(),  name="accounts-otp-verify"),

    # JWT token refresh
    path("token/refresh/", TokenRefreshView.as_view(), name="accounts-token-refresh"),

    # Password reset (admin dashboard)
    path("password/reset-request/", PasswordResetRequestView.as_view(), name="accounts-password-reset-request"),
    path("password/reset-confirm/", PasswordResetConfirmView.as_view(), name="accounts-password-reset-confirm"),

    # Admin teacher management
    path("admin/teachers/",         AdminTeacherListView.as_view(),    name="accounts-admin-teachers"),
    path("admin/teachers/invite/",  CreateTeacherInviteView.as_view(), name="accounts-admin-teacher-invite"),
]
