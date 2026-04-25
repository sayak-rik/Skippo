import logging

from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.academics.models import Student, StudentParentLink
from apps.accounts.models import ParentProfile
from apps.tenancy.models import School

from .models import (
    CallCampaign,
    CallFAQ,
    CallRequest,
    CallTokenBalance,
    CallTokenTransaction,
    CampaignCall,
)
from .serializers import (
    CallCampaignSerializer,
    CallFAQSerializer,
    CallRequestCreateSerializer,
    CallRequestSerializer,
    CallTokenBalanceSerializer,
    CampaignCallSerializer,
)

log = logging.getLogger(__name__)


def _school(request):
    slug = request.headers.get("X-School-Slug", "")
    return School.objects.filter(slug=slug, is_active=True).first()


def _token_balance(school) -> CallTokenBalance:
    obj, _ = CallTokenBalance.objects.get_or_create(school=school, defaults={"balance": 0})
    return obj


# ── FAQs (public) ─────────────────────────────────────────────────────────────

class FAQListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        faqs = CallFAQ.objects.filter(is_active=True)
        return Response(CallFAQSerializer(faqs, many=True).data)


# ── Token balance ─────────────────────────────────────────────────────────────

class TokenBalanceView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        school = _school(request)
        if not school:
            return Response({"error": "school not found"}, status=404)
        bal = _token_balance(school)
        return Response(CallTokenBalanceSerializer(bal).data)


class TokenGrantView(APIView):
    """Admin: grant tokens to a school."""
    permission_classes = [AllowAny]

    def post(self, request):
        school = _school(request)
        if not school:
            return Response({"error": "school not found"}, status=404)
        amount = int(request.data.get("amount", 0))
        if amount <= 0:
            return Response({"error": "amount must be positive"}, status=400)

        with transaction.atomic():
            bal = CallTokenBalance.objects.select_for_update().get_or_create(
                school=school, defaults={"balance": 0}
            )[0]
            bal.balance += amount
            bal.save(update_fields=["balance"])
            CallTokenTransaction.objects.create(
                school=school, delta=amount, reason="admin_grant"
            )

        return Response({"balance": bal.balance, "granted": amount})


# ── Parent call requests ───────────────────────────────────────────────────────

class ParentCallRequestListView(APIView):
    """Parent: list own requests / create new request."""
    permission_classes = [AllowAny]

    def _parent(self, request, school):
        phone = request.headers.get("X-Parent-Phone", "")
        return ParentProfile.objects.filter(school=school, phone=phone).first()

    def get(self, request):
        school = _school(request)
        if not school:
            return Response({"error": "school not found"}, status=404)
        parent = self._parent(request, school)
        if not parent:
            return Response({"error": "parent not found"}, status=404)
        reqs = CallRequest.objects.filter(school=school, parent=parent)
        return Response(CallRequestSerializer(reqs, many=True).data)

    def post(self, request):
        school = _school(request)
        if not school:
            return Response({"error": "school not found"}, status=404)
        parent = self._parent(request, school)
        if not parent:
            return Response({"error": "parent not found"}, status=404)

        # Check if the school has calls enabled (token balance exists)
        bal = _token_balance(school)
        if bal.balance < 1:
            return Response(
                {"error": "call_service_unavailable",
                 "detail": "Call service is not available. Please contact the school."},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        sz = CallRequestCreateSerializer(data=request.data)
        sz.is_valid(raise_exception=True)
        req = sz.save(school=school, parent=parent)
        return Response(CallRequestSerializer(req).data, status=status.HTTP_201_CREATED)


class ParentCallRequestCancelView(APIView):
    """Parent: cancel own pending request."""
    permission_classes = [AllowAny]

    def delete(self, request, pk):
        school = _school(request)
        phone  = request.headers.get("X-Parent-Phone", "")
        try:
            parent = ParentProfile.objects.get(school=school, phone=phone)
            req = CallRequest.objects.get(pk=pk, school=school, parent=parent)
        except (ParentProfile.DoesNotExist, CallRequest.DoesNotExist):
            return Response(status=404)
        if req.status not in ("pending", "approved"):
            return Response({"error": "cannot cancel"}, status=400)
        req.status = CallRequest.Status.CANCELLED
        req.save(update_fields=["status"])
        return Response(status=204)


# ── Dashboard: call request management ────────────────────────────────────────

class DashboardCallRequestListView(APIView):
    """Dashboard: list all call requests for the school."""
    permission_classes = [AllowAny]

    def get(self, request):
        school = _school(request)
        if not school:
            return Response({"error": "school not found"}, status=404)
        status_filter = request.query_params.get("status")
        qs = CallRequest.objects.filter(school=school).select_related("parent__user")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(CallRequestSerializer(qs, many=True).data)


class DashboardCallRequestActionView(APIView):
    """Dashboard: approve or reject a call request."""
    permission_classes = [AllowAny]

    def patch(self, request, pk):
        school = _school(request)
        if not school:
            return Response({"error": "school not found"}, status=404)
        try:
            req = CallRequest.objects.get(pk=pk, school=school)
        except CallRequest.DoesNotExist:
            return Response(status=404)

        action = request.data.get("action")
        if action == "approve":
            if req.status != CallRequest.Status.PENDING:
                return Response({"error": "can only approve pending requests"}, status=400)
            req.status = CallRequest.Status.APPROVED
            req.approved_at = timezone.now()
            req.dashboard_notes = request.data.get("notes", "")
            req.save(update_fields=["status", "approved_at", "dashboard_notes"])
        elif action == "reject":
            req.status = CallRequest.Status.REJECTED
            req.dashboard_notes = request.data.get("notes", "")
            req.save(update_fields=["status", "dashboard_notes"])
        else:
            return Response({"error": "action must be approve or reject"}, status=400)

        return Response(CallRequestSerializer(req).data)


# ── Dashboard: campaigns ───────────────────────────────────────────────────────

class CampaignListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        school = _school(request)
        if not school:
            return Response({"error": "school not found"}, status=404)
        campaigns = CallCampaign.objects.filter(school=school)
        return Response(CallCampaignSerializer(campaigns, many=True).data)

    def post(self, request):
        school = _school(request)
        if not school:
            return Response({"error": "school not found"}, status=404)
        sz = CallCampaignSerializer(data=request.data)
        sz.is_valid(raise_exception=True)
        campaign = sz.save(school=school)
        return Response(CallCampaignSerializer(campaign).data, status=status.HTTP_201_CREATED)


class CampaignApproveView(APIView):
    """
    Approve a draft campaign: validate tokens, build deduplicated call queue,
    mark as queued. The Celery scheduler picks it up from there.
    """
    permission_classes = [AllowAny]

    def post(self, request, pk):
        school = _school(request)
        if not school:
            return Response({"error": "school not found"}, status=404)
        try:
            campaign = CallCampaign.objects.get(pk=pk, school=school)
        except CallCampaign.DoesNotExist:
            return Response(status=404)
        if campaign.status != CallCampaign.Status.DRAFT:
            return Response({"error": "only draft campaigns can be approved"}, status=400)

        # Build deduplicated call list
        with transaction.atomic():
            unique_count = _build_campaign_queue(campaign)
            if unique_count == 0:
                return Response({"error": "no parents found for the given target"}, status=400)

            # Check token balance
            bal = CallTokenBalance.objects.select_for_update().get_or_create(
                school=school, defaults={"balance": 0}
            )[0]
            if bal.balance < unique_count:
                return Response(
                    {"error": "insufficient_tokens",
                     "detail": f"Need {unique_count} tokens, have {bal.balance}."},
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )

            campaign.scheduled_at = request.data.get("scheduled_at") or timezone.now()
            campaign.save(update_fields=["scheduled_at", "status", "total_calls", "tokens_estimated"])

        return Response(CallCampaignSerializer(campaign).data)


class CampaignStatusView(APIView):
    """Pause / cancel / resume a campaign."""
    permission_classes = [AllowAny]

    def patch(self, request, pk):
        school = _school(request)
        if not school:
            return Response({"error": "school not found"}, status=404)
        try:
            campaign = CallCampaign.objects.get(pk=pk, school=school)
        except CallCampaign.DoesNotExist:
            return Response(status=404)

        action = request.data.get("action")
        transitions = {
            "pause":  (["running", "queued"], "paused"),
            "resume": (["paused"],            "queued"),
            "cancel": (["draft", "queued", "running", "paused"], "cancelled"),
        }
        if action not in transitions:
            return Response({"error": "invalid action"}, status=400)
        allowed, next_status = transitions[action]
        if campaign.status not in allowed:
            return Response({"error": f"cannot {action} a {campaign.status} campaign"}, status=400)

        campaign.status = next_status
        campaign.save(update_fields=["status"])
        return Response(CallCampaignSerializer(campaign).data)


class CampaignCallListView(APIView):
    """List individual call records within a campaign."""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        school = _school(request)
        if not school:
            return Response({"error": "school not found"}, status=404)
        try:
            campaign = CallCampaign.objects.get(pk=pk, school=school)
        except CallCampaign.DoesNotExist:
            return Response(status=404)
        calls = campaign.calls.select_related("parent__user")
        return Response(CampaignCallSerializer(calls, many=True).data)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_campaign_queue(campaign: CallCampaign) -> int:
    """
    Find all students in the target group → group by primary parent →
    create one CampaignCall per unique parent (deduplication).
    Returns the number of unique parents (= calls) queued.
    """
    school = campaign.school

    if campaign.target_type == CallCampaign.TargetType.ALL:
        student_ids = list(Student.objects.filter(school=school).values_list("id", flat=True))
    elif campaign.target_type == CallCampaign.TargetType.CLASS:
        student_ids = list(
            Student.objects.filter(school=school, classroom_id__in=campaign.target_ids)
            .values_list("id", flat=True)
        )
    else:  # GRADE — target_ids contains grade/section strings matching Classroom.name
        student_ids = list(
            Student.objects.filter(school=school, classroom__name__in=campaign.target_ids)
            .values_list("id", flat=True)
        )

    if not student_ids:
        return 0

    # Aggregate all student IDs per primary parent (dedup across siblings)
    parent_students: dict[int, list[int]] = {}
    links = (
        StudentParentLink.objects
        .filter(student_id__in=student_ids, school=school, is_primary=True)
        .values("parent_id", "student_id")
    )
    for link in links:
        parent_students.setdefault(link["parent_id"], []).append(link["student_id"])

    calls = [
        CampaignCall(
            campaign=campaign,
            school=school,
            parent_id=parent_id,
            student_ids=sids,
        )
        for parent_id, sids in parent_students.items()
    ]
    CampaignCall.objects.bulk_create(calls, ignore_conflicts=True)

    count = len(calls)
    campaign.total_calls     = count
    campaign.tokens_estimated = count
    campaign.status           = CallCampaign.Status.QUEUED
    campaign.save(update_fields=["total_calls", "tokens_estimated", "status"])
    return count
