from rest_framework import serializers

from .models import FeeCategory, FeeInvoice, FeeStructure, PaymentTransaction, RazorpayLinkedAccount


class FeeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = FeeCategory
        fields = ["id", "name", "description", "is_active"]


class FeeStructureSerializer(serializers.ModelSerializer):
    category_name  = serializers.CharField(source="category.name", read_only=True)
    classroom_name = serializers.SerializerMethodField()

    class Meta:
        model  = FeeStructure
        fields = [
            "id", "category", "category_name", "classroom", "classroom_name",
            "amount", "frequency", "due_day", "academic_year", "is_active",
        ]

    def get_classroom_name(self, obj):
        return obj.classroom.name if obj.classroom_id else None


class FeeInvoiceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)

    class Meta:
        model  = FeeInvoice
        fields = [
            "id", "student", "student_name", "category_name", "amount",
            "due_date", "status", "razorpay_order_id", "paid_at",
        ]


class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PaymentTransaction
        fields = [
            "id", "invoice", "razorpay_payment_id", "amount",
            "platform_fee", "school_amount", "transfer_id", "status", "created_at",
        ]


class RazorpayLinkedAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model  = RazorpayLinkedAccount
        fields = ["id", "account_id", "name", "email", "status", "details"]
