from django.urls import path

from .views import (
    AIClassesRootView,
    AdminAIClassActivateView,
    AdminAIClassDetailView,
    AdminAIClassEndView,
    AdminAIClassListView,
    AdminClassFeedbackView,
    AdminClassTokensView,
    ParentStudentAIClassListView,
    WebhookView,
)

urlpatterns = [
    path("",                                         AIClassesRootView.as_view(),           name="ai-classes-root"),
    path("admin/classes/",                           AdminAIClassListView.as_view(),        name="admin-ai-class-list"),
    path("admin/classes/<int:class_id>/",            AdminAIClassDetailView.as_view(),      name="admin-ai-class-detail"),
    path("admin/classes/<int:class_id>/activate/",   AdminAIClassActivateView.as_view(),    name="admin-ai-class-activate"),
    path("admin/classes/<int:class_id>/end/",        AdminAIClassEndView.as_view(),         name="admin-ai-class-end"),
    path("admin/classes/<int:class_id>/tokens/",     AdminClassTokensView.as_view(),        name="admin-ai-class-tokens"),
    path("admin/classes/<int:class_id>/feedback/",   AdminClassFeedbackView.as_view(),      name="admin-ai-class-feedback"),
    path("parent/students/<int:student_id>/classes/", ParentStudentAIClassListView.as_view(), name="parent-ai-class-list"),
    path("webhook/",                                 WebhookView.as_view(),                 name="ai-class-webhook"),
]
