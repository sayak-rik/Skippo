from django.urls import path

from apps.accounts.views import (
    AcceptDriverInviteView,
    AcceptInviteView,
    AccountsRootView,
    DemoLoginView,
    DriverSelfSignupView,
    MeView,
    ValidateDriverInviteView,
    ValidateInviteView,
)

urlpatterns = [
    # Module health
    path("", AccountsRootView.as_view(), name="accounts-root"),

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
]
