from django.urls import path

from .views import (
    AllocatePodView,
    FetchTestConfigView,
    HealthView,
    PodHeartbeatView,
    PodSnapshotView,
    RegisterTestView,
    ReleaseSessionView,
)

urlpatterns = [
    path("health/",                          HealthView.as_view(),         name="health"),
    path("register-test/",                   RegisterTestView.as_view(),   name="register-test"),
    path("allocate-pod/",                    AllocatePodView.as_view(),    name="allocate-pod"),
    path("release-session/",                 ReleaseSessionView.as_view(), name="release-session"),
    path("heartbeat/",                       PodHeartbeatView.as_view(),   name="heartbeat"),
    path("fetch-config/<str:test_id>/",      FetchTestConfigView.as_view(), name="fetch-config"),
    path("pods/",                            PodSnapshotView.as_view(),    name="pods"),
]
