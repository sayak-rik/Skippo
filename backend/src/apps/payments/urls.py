from django.urls import path

from . import views

urlpatterns = [
    # Admin — fee structure setup
    path("categories/",                    views.FeeCategoryListCreateView.as_view()),
    path("categories/<int:pk>/",           views.FeeCategoryDetailView.as_view()),
    path("structures/",                    views.FeeStructureListCreateView.as_view()),
    path("structures/<int:pk>/",           views.FeeStructureDetailView.as_view()),
    path("structures/<int:pk>/generate/",  views.GenerateInvoicesView.as_view()),

    # Admin — invoices + analytics
    path("invoices/",                      views.AdminInvoiceListView.as_view()),
    path("summary/",                       views.FeeCollectionSummaryView.as_view()),

    # Admin — Razorpay linked account (Route)
    path("linked-account/",               views.LinkedAccountView.as_view()),

    # Parent — fees
    path("parent/invoices/",              views.ParentInvoiceListView.as_view()),
    path("parent/orders/",                views.CreatePaymentOrderView.as_view()),
    path("parent/verify/",                views.VerifyPaymentView.as_view()),
    path("parent/transactions/",          views.ParentTransactionListView.as_view()),
]
