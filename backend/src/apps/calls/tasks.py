"""
Call queue scheduler — runs every minute via Celery Beat.
Processes:
  1. Approved individual call requests (parent-initiated)
  2. Queued / running campaign calls (school-initiated mass calls)

Rate limiting: respects `campaign.rate_limit_per_hour` by counting calls made
in the last 60 minutes and only dispatching up to the remaining allowance.
"""
import logging
from datetime import timedelta

import httpx
from celery import shared_task
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .models import (
    CallCampaign,
    CallRequest,
    CallTokenBalance,
    CallTokenTransaction,
    CampaignCall,
)

log = logging.getLogger(__name__)

_CALL_AGENT = getattr(settings, "CALL_AGENT_URL", "http://call-agent:8091")


def _deduct_token(school, reason: str, call_request=None, campaign=None) -> bool:
    """Atomically deduct one token. Returns False if balance is 0."""
    with transaction.atomic():
        try:
            bal = CallTokenBalance.objects.select_for_update().get(school=school)
        except CallTokenBalance.DoesNotExist:
            return False
        if bal.balance < 1:
            return False
        bal.balance -= 1
        bal.save(update_fields=["balance"])
        CallTokenTransaction.objects.create(
            school=school,
            delta=-1,
            reason=reason,
            call_request=call_request,
            campaign=campaign,
        )
    return True


def _fire_call(payload: dict) -> str | None:
    """POST to call-agent /call/initiate. Returns call_uuid or None on failure."""
    try:
        resp = httpx.post(f"{_CALL_AGENT}/call/initiate", json=payload, timeout=12.0)
        resp.raise_for_status()
        return resp.json().get("call_uuid")
    except Exception as exc:
        log.error("call-agent initiate failed: %s", exc)
        return None


@shared_task(name="apps.calls.tasks.process_call_queue")
def process_call_queue():
    """Scheduler tick — dispatches approved requests and campaign batches."""
    _process_individual_requests()
    _process_campaigns()


# ── Individual approved requests ──────────────────────────────────────────────

def _process_individual_requests():
    approved = (
        CallRequest.objects.filter(status=CallRequest.Status.APPROVED)
        .select_related("parent__user", "school")
    )
    for req in approved:
        ok = _deduct_token(req.school, reason="call_request", call_request=req)
        if not ok:
            log.info("School %s has no tokens — skipping call request #%d", req.school, req.pk)
            continue

        call_uuid = _fire_call({
            "objective":    "general_notification",
            "contact_type": "parent",
            "contact_id":   req.parent_id,
            "campaign_context": {
                "reason_text":      req.reason_text or req.get_reason_category_display(),
                "reason_category":  req.reason_category,
                "call_request_id":  req.pk,
                "campaign_id":      None,
                "campaign_call_id": None,
            },
        })

        if call_uuid:
            req.status    = CallRequest.Status.CALLING
            req.call_uuid = call_uuid
            req.save(update_fields=["status", "call_uuid"])
        else:
            # Refund token on failure
            with transaction.atomic():
                bal = CallTokenBalance.objects.select_for_update().get(school=req.school)
                bal.balance += 1
                bal.save(update_fields=["balance"])
                CallTokenTransaction.objects.create(
                    school=req.school, delta=1, reason="refund:call_request_failed"
                )


# ── Campaign scheduler ────────────────────────────────────────────────────────

def _process_campaigns():
    active = CallCampaign.objects.filter(
        status__in=[CallCampaign.Status.QUEUED, CallCampaign.Status.RUNNING]
    ).select_related("school")

    now = timezone.now()

    for campaign in active:
        # Honour scheduled_at
        if campaign.scheduled_at and campaign.scheduled_at > now:
            continue

        # Mark as running if first tick
        if campaign.status == CallCampaign.Status.QUEUED:
            campaign.status     = CallCampaign.Status.RUNNING
            campaign.started_at = now
            campaign.save(update_fields=["status", "started_at"])

        # Rate-limit: count calls dispatched in the last hour
        one_hour_ago = now - timedelta(hours=1)
        calls_this_hour = campaign.calls.filter(
            status__in=[CampaignCall.Status.CALLING, CampaignCall.Status.COMPLETED, CampaignCall.Status.FAILED],
            called_at__gte=one_hour_ago,
        ).count()

        slots = campaign.rate_limit_per_hour - calls_this_hour
        if slots <= 0:
            continue

        # Per-tick max: proportional slice of hourly limit (≈1 min granularity)
        per_tick = max(1, campaign.rate_limit_per_hour // 60)
        batch    = min(slots, per_tick)

        queued_calls = list(campaign.calls.filter(status=CampaignCall.Status.QUEUED)[:batch])
        if not queued_calls:
            # Campaign exhausted — mark complete
            campaign.status       = CallCampaign.Status.COMPLETED
            campaign.completed_at = now
            campaign.save(update_fields=["status", "completed_at"])
            continue

        for cc in queued_calls:
            ok = _deduct_token(campaign.school, reason=f"campaign:{campaign.pk}", campaign=campaign)
            if not ok:
                log.info("School %s has no tokens — pausing campaign #%d", campaign.school, campaign.pk)
                campaign.status = CallCampaign.Status.PAUSED
                campaign.save(update_fields=["status"])
                break

            # Resolve student names for the LLM context
            student_names = list(
                cc.parent.students  # reverse relation via StudentParentLink → Student
                .filter(id__in=cc.student_ids)
                .values_list("full_name", flat=True)
            )

            call_uuid = _fire_call({
                "objective":    campaign.objective,
                "contact_type": "parent",
                "contact_id":   cc.parent_id,
                "campaign_context": {
                    "reason_text":      campaign.reason_text,
                    "campaign_id":      campaign.pk,
                    "campaign_name":    campaign.name,
                    "campaign_call_id": cc.pk,
                    "student_ids":      cc.student_ids,
                    "student_names":    student_names,
                },
            })

            if call_uuid:
                cc.status        = CampaignCall.Status.CALLING
                cc.call_uuid     = call_uuid
                cc.called_at     = now
                cc.attempt_count += 1
                cc.save(update_fields=["status", "call_uuid", "called_at", "attempt_count"])

                campaign.tokens_used += 1
                campaign.save(update_fields=["tokens_used"])
            else:
                # Refund token; leave call as queued for retry next tick
                with transaction.atomic():
                    bal = CallTokenBalance.objects.select_for_update().get(school=campaign.school)
                    bal.balance += 1
                    bal.save(update_fields=["balance"])
                    CallTokenTransaction.objects.create(
                        school=campaign.school, delta=1, reason="refund:campaign_call_failed"
                    )
