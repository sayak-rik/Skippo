from django.urls import path

from apps.accounts.views import AccountsRootView, DemoLoginView, MeView


urlpatterns = [
    path("", AccountsRootView.as_view(), name="accounts-root"),
    path("demo-login/", DemoLoginView.as_view(), name="accounts-demo-login"),
    path("me/", MeView.as_view(), name="accounts-me"),
]
