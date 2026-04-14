from django.urls import path

from apps.notifications.views import DriverDevicesView, NotificationsRootView, ParentAlertsView, TriggerSOSView


urlpatterns = [
    path("", NotificationsRootView.as_view(), name="notifications-root"),
    path("parent/feed/", ParentAlertsView.as_view(), name="notifications-parent-feed"),
    path("driver/devices/", DriverDevicesView.as_view(), name="notifications-driver-devices"),
    path("sos/", TriggerSOSView.as_view(), name="notifications-sos"),
]
