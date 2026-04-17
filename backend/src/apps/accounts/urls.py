from django.urls import path

from apps.accounts.views import (
    AcceptInviteView,
    AccountsRootView,
    DemoLoginView,
    MeView,
    ValidateInviteView,
)

urlpatterns = [
    # Module health
    path("", AccountsRootView.as_view(), name="accounts-root"),

    # Demo auth
    path("demo-login/", DemoLoginView.as_view(), name="accounts-demo-login"),
    path("me/", MeView.as_view(), name="accounts-me"),

    # Teacher invite flow
    # GET  /api/auth/teacher/invite/<token>/  – validate token, return school context
    # POST /api/auth/teacher/accept-invite/   – complete signup, returns login payload
    path("teacher/invite/<str:token>/", ValidateInviteView.as_view(), name="accounts-validate-invite"),
    path("teacher/accept-invite/",      AcceptInviteView.as_view(),   name="accounts-accept-invite"),
]
