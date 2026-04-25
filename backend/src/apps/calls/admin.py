from django.contrib import admin

from .models import (
    CallCampaign,
    CallFAQ,
    CallRequest,
    CallTokenBalance,
    CallTokenTransaction,
    CampaignCall,
)


@admin.register(CallFAQ)
class CallFAQAdmin(admin.ModelAdmin):
    list_display  = ["question", "category", "order", "is_active"]
    list_editable = ["order", "is_active"]


@admin.register(CallTokenBalance)
class CallTokenBalanceAdmin(admin.ModelAdmin):
    list_display = ["school", "balance", "updated_at"]
    readonly_fields = ["updated_at"]


@admin.register(CallTokenTransaction)
class CallTokenTransactionAdmin(admin.ModelAdmin):
    list_display  = ["school", "delta", "reason", "created_at"]
    list_filter   = ["school", "reason"]
    readonly_fields = ["created_at"]


@admin.register(CallRequest)
class CallRequestAdmin(admin.ModelAdmin):
    list_display  = ["pk", "school", "parent", "reason_category", "status", "created_at"]
    list_filter   = ["status", "reason_category"]
    readonly_fields = ["call_uuid", "approved_at", "created_at", "updated_at"]


class CampaignCallInline(admin.TabularInline):
    model         = CampaignCall
    extra         = 0
    readonly_fields = ["call_uuid", "status", "called_at", "outcome", "attempt_count"]
    can_delete    = False


@admin.register(CallCampaign)
class CallCampaignAdmin(admin.ModelAdmin):
    list_display  = ["name", "school", "objective", "status", "total_calls", "tokens_used", "created_at"]
    list_filter   = ["status", "objective"]
    readonly_fields = [
        "total_calls", "completed_calls", "failed_calls",
        "tokens_used", "started_at", "completed_at", "created_at", "updated_at",
    ]
    inlines       = [CampaignCallInline]
