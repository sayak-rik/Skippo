from rest_framework import serializers

from .models import (
    CallCampaign,
    CallFAQ,
    CallRequest,
    CallTokenBalance,
    CallTokenTransaction,
    CampaignCall,
)


class CallFAQSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CallFAQ
        fields = ["id", "question", "answer", "category", "order"]


class CallTokenBalanceSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CallTokenBalance
        fields = ["balance", "updated_at"]


class CallTokenTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CallTokenTransaction
        fields = ["id", "delta", "reason", "created_at"]


class CallRequestSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source="parent.user.get_full_name", read_only=True)
    parent_phone = serializers.CharField(source="parent.phone", read_only=True)

    class Meta:
        model  = CallRequest
        fields = [
            "id", "reason_category", "reason_text", "status",
            "call_uuid", "approved_at", "dashboard_notes",
            "parent_name", "parent_phone", "created_at", "updated_at",
        ]
        read_only_fields = ["status", "call_uuid", "approved_at", "created_at", "updated_at"]


class CallRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CallRequest
        fields = ["reason_category", "reason_text"]


class CampaignCallSerializer(serializers.ModelSerializer):
    parent_name  = serializers.CharField(source="parent.user.get_full_name", read_only=True)
    parent_phone = serializers.CharField(source="parent.phone", read_only=True)

    class Meta:
        model  = CampaignCall
        fields = [
            "id", "parent_name", "parent_phone", "student_ids",
            "call_uuid", "status", "attempt_count", "called_at", "outcome",
        ]


class CallCampaignSerializer(serializers.ModelSerializer):
    progress_pct = serializers.SerializerMethodField()

    class Meta:
        model  = CallCampaign
        fields = [
            "id", "name", "reason_text", "objective", "target_type", "target_ids",
            "status", "rate_limit_per_hour",
            "total_calls", "completed_calls", "failed_calls",
            "tokens_estimated", "tokens_used",
            "scheduled_at", "started_at", "completed_at",
            "created_at", "updated_at", "progress_pct",
        ]
        read_only_fields = [
            "status", "total_calls", "completed_calls", "failed_calls",
            "tokens_estimated", "tokens_used", "started_at", "completed_at",
            "created_at", "updated_at",
        ]

    def get_progress_pct(self, obj) -> int:
        if obj.total_calls == 0:
            return 0
        return round((obj.completed_calls / obj.total_calls) * 100)
