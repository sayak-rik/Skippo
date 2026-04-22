from django.urls import path

from apps.dismissal.views import (
    DismissalCompleteView,
    DismissalIntentView,
    DismissalQueueView,
    DismissalReadyView,
    DismissalRootView,
)

urlpatterns = [
    path("", DismissalRootView.as_view(), name="dismissal-root"),
    path("intent/", DismissalIntentView.as_view(), name="dismissal-intent"),
    path("queue/", DismissalQueueView.as_view(), name="dismissal-queue"),
    path("ready/<int:student_id>/", DismissalReadyView.as_view(), name="dismissal-ready"),
    path("complete/<int:student_id>/", DismissalCompleteView.as_view(), name="dismissal-complete"),
]
