from django.urls import path

from .views import (
    CampaignApproveView,
    CampaignCallListView,
    CampaignListCreateView,
    CampaignStatusView,
    DashboardCallRequestActionView,
    DashboardCallRequestListView,
    FAQListView,
    ParentCallRequestCancelView,
    ParentCallRequestListView,
    TokenBalanceView,
    TokenGrantView,
)

urlpatterns = [
    # FAQs (public)
    path("faq/",                                FAQListView.as_view()),

    # Token management
    path("tokens/",                             TokenBalanceView.as_view()),
    path("tokens/grant/",                       TokenGrantView.as_view()),

    # Parent-facing call requests
    path("requests/",                           ParentCallRequestListView.as_view()),
    path("requests/<int:pk>/cancel/",           ParentCallRequestCancelView.as_view()),

    # Dashboard — call request management
    path("dashboard/requests/",                 DashboardCallRequestListView.as_view()),
    path("dashboard/requests/<int:pk>/action/", DashboardCallRequestActionView.as_view()),

    # Dashboard — campaigns
    path("dashboard/campaigns/",                CampaignListCreateView.as_view()),
    path("dashboard/campaigns/<int:pk>/approve/", CampaignApproveView.as_view()),
    path("dashboard/campaigns/<int:pk>/status/",  CampaignStatusView.as_view()),
    path("dashboard/campaigns/<int:pk>/calls/",   CampaignCallListView.as_view()),
]
