from datetime import date
from decimal import Decimal

import httpx
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import status as http_status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import ParentProfile
from apps.tenancy.models import School
from .models import FeeCategory, FeeInvoice, FeeStructure, PaymentTransaction, RazorpayLinkedAccount
from .serializers import (
    FeeCategorySerializer,
    FeeInvoiceSerializer,
    FeeStructureSerializer,
    PaymentTransactionSerializer,
    RazorpayLinkedAccountSerializer,
)

PAYMENT_SERVICE_URL = getattr(settings, "PAYMENT_SERVICE_URL", "http://payment-service:8092")
PLATFORM_COMMISSION_PCT = Decimal(str(getattr(settings, "PLATFORM_COMMISSION_PCT", "2.0")))


def _school(request) -> School:
    return School.objects.get(slug=request.tenant_slug)


# ── Admin: Fee Categories ─────────────────────────────────────────────────────

class FeeCategoryListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        school = _school(request)
        qs = FeeCategory.objects.filter(school=school)
        return Response(FeeCategorySerializer(qs, many=True).data)

    def post(self, request):
        school = _school(request)
        ser = FeeCategorySerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save(school=school)
        return Response(ser.data, status=http_status.HTTP_201_CREATED)


class FeeCategoryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _obj(self, request, pk):
        return FeeCategory.objects.get(pk=pk, school=_school(request))

    def put(self, request, pk):
        obj = self._obj(request, pk)
        ser = FeeCategorySerializer(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)

    def delete(self, request, pk):
        self._obj(request, pk).delete()
        return Response(status=http_status.HTTP_204_NO_CONTENT)


# ── Admin: Fee Structures ─────────────────────────────────────────────────────

class FeeStructureListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        school = _school(request)
        qs = FeeStructure.objects.filter(school=school).select_related("category", "classroom")
        return Response(FeeStructureSerializer(qs, many=True).data)

    def post(self, request):
        school = _school(request)
        ser = FeeStructureSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save(school=school)
        return Response(ser.data, status=http_status.HTTP_201_CREATED)


class FeeStructureDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _obj(self, request, pk):
        return FeeStructure.objects.get(pk=pk, school=_school(request))

    def put(self, request, pk):
        obj = self._obj(request, pk)
        ser = FeeStructureSerializer(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)

    def delete(self, request, pk):
        self._obj(request, pk).delete()
        return Response(status=http_status.HTTP_204_NO_CONTENT)


# ── Admin: Invoices + collection summary ──────────────────────────────────────

class AdminInvoiceListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        school = _school(request)
        qs = FeeInvoice.objects.filter(school=school).select_related("student")
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(FeeInvoiceSerializer(qs, many=True).data)


class FeeCollectionSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        school   = _school(request)
        invoices = FeeInvoice.objects.filter(school=school)
        pending  = invoices.filter(status="pending")
        overdue  = invoices.filter(status="overdue")
        paid     = invoices.filter(status="paid")

        total_collected = sum(
            t.amount
            for t in PaymentTransaction.objects.filter(school=school, status="captured")
        )
        return Response({
            "total_collected":  float(total_collected),
            "pending_count":    pending.count(),
            "pending_amount":   float(sum(i.amount for i in pending)),
            "overdue_count":    overdue.count(),
            "overdue_amount":   float(sum(i.amount for i in overdue)),
            "paid_count":       paid.count(),
        })


# ── Admin: Generate invoices from a fee structure ─────────────────────────────

class GenerateInvoicesView(APIView):
    """Admin triggers manual invoice generation for a fee structure."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        school = _school(request)
        try:
            structure = FeeStructure.objects.get(pk=pk, school=school, is_active=True)
        except FeeStructure.DoesNotExist:
            return Response({"detail": "Fee structure not found."}, status=404)

        due_date = request.data.get("due_date")
        if not due_date:
            return Response({"detail": "due_date is required (YYYY-MM-DD)."}, status=400)

        from apps.academics.models import Student, StudentParentLink

        if structure.classroom_id:
            students = Student.objects.filter(school=school, classroom=structure.classroom)
        else:
            students = Student.objects.filter(school=school)

        created = 0
        for student in students:
            if not FeeInvoice.objects.filter(
                school=school, student=student,
                fee_structure=structure, due_date=due_date,
            ).exists():
                FeeInvoice.objects.create(
                    school=school,
                    student=student,
                    fee_structure=structure,
                    category_name=structure.category.name,
                    amount=structure.amount,
                    due_date=due_date,
                    status="pending",
                )
                created += 1

        return Response({"created": created})


# ── Admin: Razorpay Linked Account (Route) ────────────────────────────────────

class LinkedAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        school = _school(request)
        try:
            obj = RazorpayLinkedAccount.objects.get(school=school)
            return Response(RazorpayLinkedAccountSerializer(obj).data)
        except RazorpayLinkedAccount.DoesNotExist:
            return Response({"detail": "No linked account configured."}, status=404)

    def post(self, request):
        school = _school(request)
        if RazorpayLinkedAccount.objects.filter(school=school).exists():
            return Response({"detail": "Linked account already exists."}, status=400)

        try:
            resp = httpx.post(
                f"{PAYMENT_SERVICE_URL}/accounts/create",
                json={
                    "school_id":   school.id,
                    "school_name": school.name,
                    "email":       request.data.get("email", ""),
                    "profile":     request.data.get("profile", {}),
                },
                timeout=15.0,
            )
            resp.raise_for_status()
        except Exception as exc:
            return Response({"detail": str(exc)}, status=502)

        data = resp.json()
        obj  = RazorpayLinkedAccount.objects.create(
            school=school,
            account_id=data["account_id"],
            name=data.get("name", school.name),
            email=data.get("email", ""),
            status=data.get("status", "created"),
            details=data,
        )
        return Response(RazorpayLinkedAccountSerializer(obj).data, status=201)


# ── Parent: Invoice list ──────────────────────────────────────────────────────

def _parent_and_school(request):
    """Derive parent + school from the authenticated JWT user (no header dependency)."""
    parent = ParentProfile.objects.select_related("school").get(user=request.user)
    return parent, parent.school


class ParentInvoiceListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            parent, school = _parent_and_school(request)
        except ParentProfile.DoesNotExist:
            return Response({"detail": "Parent profile not found."}, status=404)

        student_ids = parent.student_links.values_list("student_id", flat=True)
        qs = FeeInvoice.objects.filter(school=school, student_id__in=student_ids).select_related("student")
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(FeeInvoiceSerializer(qs, many=True).data)


# ── Parent: Create Razorpay order ─────────────────────────────────────────────

class CreatePaymentOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            parent, school = _parent_and_school(request)
        except ParentProfile.DoesNotExist:
            return Response({"detail": "Parent profile not found."}, status=404)

        invoice_id = request.data.get("invoice_id")

        try:
            invoice = FeeInvoice.objects.get(
                pk=invoice_id, school=school,
                student__parent_links__parent=parent,
            )
        except FeeInvoice.DoesNotExist:
            return Response({"detail": "Invoice not found."}, status=404)

        if invoice.status == FeeInvoice.Status.PAID:
            return Response({"detail": "Invoice already paid."}, status=400)

        try:
            linked = RazorpayLinkedAccount.objects.get(school=school)
            linked_account_id = linked.account_id
        except RazorpayLinkedAccount.DoesNotExist:
            linked_account_id = None

        platform_fee  = (invoice.amount * PLATFORM_COMMISSION_PCT / 100).quantize(Decimal("0.01"))
        school_amount = invoice.amount - platform_fee

        try:
            resp = httpx.post(
                f"{PAYMENT_SERVICE_URL}/orders/create",
                json={
                    "amount_paise":        int(invoice.amount * 100),
                    "receipt":             f"inv_{invoice.id}",
                    "linked_account_id":   linked_account_id,
                    "school_amount_paise": int(school_amount * 100),
                },
                timeout=10.0,
            )
            resp.raise_for_status()
        except Exception as exc:
            return Response({"detail": str(exc)}, status=502)

        data = resp.json()
        invoice.razorpay_order_id = data["order_id"]
        invoice.save(update_fields=["razorpay_order_id"])

        return Response({
            "order_id":    data["order_id"],
            "amount":      int(invoice.amount * 100),
            "currency":    "INR",
            "key_id":      getattr(settings, "RAZORPAY_KEY_ID", ""),
            "invoice_id":  invoice.id,
            "school_name": school.name,
            "description": f"{invoice.category_name} — {invoice.student.full_name}",
        })


# ── Parent: Verify payment signature + persist ────────────────────────────────

class VerifyPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            parent, school = _parent_and_school(request)
        except ParentProfile.DoesNotExist:
            return Response({"detail": "Parent profile not found."}, status=404)

        invoice_id = request.data.get("invoice_id")
        payment_id = request.data.get("razorpay_payment_id")
        order_id   = request.data.get("razorpay_order_id")
        signature  = request.data.get("razorpay_signature")

        try:
            invoice = FeeInvoice.objects.get(
                pk=invoice_id, school=school,
                student__parent_links__parent=parent,
            )
        except FeeInvoice.DoesNotExist:
            return Response({"detail": "Invoice not found."}, status=404)

        try:
            resp = httpx.post(
                f"{PAYMENT_SERVICE_URL}/orders/verify",
                json={
                    "razorpay_payment_id": payment_id,
                    "razorpay_order_id":   order_id,
                    "razorpay_signature":  signature,
                },
                timeout=10.0,
            )
            resp.raise_for_status()
        except Exception as exc:
            return Response({"detail": str(exc)}, status=502)

        result = resp.json()
        if not result.get("valid"):
            return Response({"detail": "Payment verification failed."}, status=400)

        platform_fee  = (invoice.amount * PLATFORM_COMMISSION_PCT / 100).quantize(Decimal("0.01"))
        school_amount = invoice.amount - platform_fee

        with transaction.atomic():
            invoice.status  = FeeInvoice.Status.PAID
            invoice.paid_at = timezone.now()
            invoice.save(update_fields=["status", "paid_at"])

            PaymentTransaction.objects.create(
                invoice=invoice,
                school=school,
                parent=parent,
                razorpay_payment_id=payment_id,
                razorpay_order_id=order_id,
                razorpay_signature=signature,
                amount=invoice.amount,
                platform_fee=platform_fee,
                school_amount=school_amount,
                transfer_id=result.get("transfer_id", ""),
                status=PaymentTransaction.Status.CAPTURED,
            )

        return Response({"status": "paid", "invoice_id": invoice.id})


# ── Parent: Payment history ────────────────────────────────────────────────────

class ParentTransactionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            parent, school = _parent_and_school(request)
        except ParentProfile.DoesNotExist:
            return Response({"detail": "Parent profile not found."}, status=404)

        qs = PaymentTransaction.objects.filter(school=school, parent=parent)
        return Response(PaymentTransactionSerializer(qs, many=True).data)
