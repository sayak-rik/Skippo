from django.urls import path

from apps.assessments.views import (
    AdminResultDetailView,
    AdminResultPublishView,
    AdminTestCloseView,
    AdminTestDetailView,
    AdminTestListView,
    AdminTestPublishView,
    AdminTestQuestionDetailView,
    AdminTestQuestionListView,
    AdminTestResultsView,
    AssessmentsRootView,
    ParentStudentTestAccessView,
    ParentStudentTestListView,
    TeacherTestListView,
    TeacherTestResultsView,
    WebhookResultsView,
)

urlpatterns = [
    # Module health
    path("", AssessmentsRootView.as_view(), name="assessments-root"),

    # ── Admin ──────────────────────────────────────────────────────────────────
    path("admin/tests/",                             AdminTestListView.as_view(),            name="admin-test-list"),
    path("admin/tests/<int:test_id>/",               AdminTestDetailView.as_view(),          name="admin-test-detail"),
    path("admin/tests/<int:test_id>/publish/",       AdminTestPublishView.as_view(),         name="admin-test-publish"),
    path("admin/tests/<int:test_id>/close/",         AdminTestCloseView.as_view(),           name="admin-test-close"),
    path("admin/tests/<int:test_id>/questions/",     AdminTestQuestionListView.as_view(),    name="admin-test-question-list"),
    path(
        "admin/tests/<int:test_id>/questions/<int:question_id>/",
        AdminTestQuestionDetailView.as_view(),
        name="admin-test-question-detail",
    ),
    path("admin/tests/<int:test_id>/results/",       AdminTestResultsView.as_view(),         name="admin-test-results"),
    path("admin/results/<int:result_id>/",           AdminResultDetailView.as_view(),        name="admin-result-detail"),
    path("admin/results/<int:result_id>/publish/",   AdminResultPublishView.as_view(),       name="admin-result-publish"),

    # ── Teacher ────────────────────────────────────────────────────────────────
    path("teacher/tests/",                           TeacherTestListView.as_view(),          name="teacher-test-list"),
    path("teacher/tests/<int:test_id>/results/",     TeacherTestResultsView.as_view(),       name="teacher-test-results"),

    # ── Parent ─────────────────────────────────────────────────────────────────
    path(
        "parent/students/<int:student_id>/tests/",
        ParentStudentTestListView.as_view(),
        name="parent-student-test-list",
    ),
    path(
        "parent/students/<int:student_id>/tests/<int:test_id>/access/",
        ParentStudentTestAccessView.as_view(),
        name="parent-student-test-access",
    ),

    # ── Webhook (called by exam-engine pods) ───────────────────────────────────
    path("webhook/results/", WebhookResultsView.as_view(), name="webhook-results"),
]
