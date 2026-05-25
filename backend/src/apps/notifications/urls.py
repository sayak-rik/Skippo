from django.urls import path

from apps.notifications.views import (
    DriverDevicesView,
    NotificationsRootView,
    ParentAlertsView,
    RegisterDeviceView,
    TriggerBreakdownView,
    TriggerSOSView,
)


urlpatterns = [
    path("", NotificationsRootView.as_view(), name="notifications-root"),
    path("parent/feed/",            ParentAlertsView.as_view(),   name="notifications-parent-feed"),
    path("parent/register-device/", RegisterDeviceView.as_view(), name="notifications-register-device"),
    path("driver/devices/",         DriverDevicesView.as_view(),  name="notifications-driver-devices"),

    # Emergency events from driver app (req 10, 11)
    path("sos/",       TriggerSOSView.as_view(),       name="notifications-sos"),
    path("breakdown/", TriggerBreakdownView.as_view(), name="notifications-breakdown"),
]
