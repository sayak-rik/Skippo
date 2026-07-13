from django.urls import path

from .views import (
    AllocatePodView,
    EndClassView,
    FetchClassConfigView,
    HealthView,
    PodHeartbeatView,
    PodSnapshotView,
    RegisterClassView,
)

urlpatterns = [
    path("health/",                          HealthView.as_view(),         name="health"),
    path("register-class/",                  RegisterClassView.as_view(),  name="register-class"),
    path("allocate-pod/",                    AllocatePodView.as_view(),    name="allocate-pod"),
    path("end-class/",                       EndClassView.as_view(),       name="end-class"),
    path("heartbeat/",                       PodHeartbeatView.as_view(),   name="heartbeat"),
    path("config/<str:class_id>/",           FetchClassConfigView.as_view(), name="fetch-config"),
    path("pods/",                            PodSnapshotView.as_view(),    name="pods"),
]
