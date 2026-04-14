from django.urls import path

from apps.communications.views import CommunicationsRootView, ParentFeedView


urlpatterns = [
    path("", CommunicationsRootView.as_view(), name="communications-root"),
    path("parent/feed/", ParentFeedView.as_view(), name="communications-parent-feed"),
]
