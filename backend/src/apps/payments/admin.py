from django.contrib import admin

from .models import FeeCategory, FeeInvoice, FeeStructure, PaymentTransaction, RazorpayLinkedAccount


@admin.register(RazorpayLinkedAccount)
class RazorpayLinkedAccountAdmin(admin.ModelAdmin):
    list_display = ["school", "account_id", "name", "email", "status", "created_at"]
    list_filter  = ["status"]


@admin.register(FeeCategory)
class FeeCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "school", "is_active"]
    list_filter  = ["is_active", "school"]


@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ["category", "classroom", "school", "amount", "frequency", "due_day", "is_active"]
    list_filter  = ["frequency", "is_active", "school"]


@admin.register(FeeInvoice)
class FeeInvoiceAdmin(admin.ModelAdmin):
    list_display  = ["student", "category_name", "amount", "due_date", "status", "school"]
    list_filter   = ["status", "school"]
    search_fields = ["student__full_name", "category_name"]
    date_hierarchy = "due_date"


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display  = ["razorpay_payment_id", "invoice", "amount", "platform_fee", "school_amount", "status", "created_at"]
    list_filter   = ["status", "school"]
    search_fields = ["razorpay_payment_id", "razorpay_order_id"]
