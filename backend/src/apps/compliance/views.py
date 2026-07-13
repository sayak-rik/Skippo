import logging

from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.compliance.models import ComplianceDocument, DigiLockerVerification, RenewalReminder
from apps.tenancy.models import School

log = logging.getLogger(__name__)


def _school(request) -> School:
    return School.objects.get(slug=request.tenant_slug)


class ComplianceRootView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"module": "compliance", "status": "ready", "mode": "live"})


class DriverRenewalsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        reminders = RenewalReminder.objects.select_related("document").order_by("remind_on")
        results = [
            {
                "id": r.id,
                "documentType": r.document.document_type,
                "ownerType": r.document.owner_type,
                "ownerId": r.document.owner_id,
                "remindOn": str(r.remind_on),
                "sent": r.sent,
            }
            for r in reminders
        ]
        return Response({"results": results})


# ── DigiLocker verification pipeline ──────────────────────────────────────────

def _verification_dict(v: DigiLockerVerification) -> dict:
    return {
        "id": v.id,
        "driver_id": v.driver_id,
        "doc_type": v.doc_type,
        "document_number": v.document_number,
        "status": v.status,
        "provider": v.provider,
        "request_id": str(v.request_id),
        "failure_reason": v.failure_reason,
        "verified_at": v.verified_at.isoformat() if v.verified_at else None,
        "created_at": v.created_at.isoformat(),
    }


def _mark_verified(verification: DigiLockerVerification, payload: dict, provider: str) -> None:
    """Record success, flag the driver as KYC-verified, and file the document
    into the compliance/renewals pipeline."""
    verification.status = DigiLockerVerification.Status.VERIFIED
    verification.provider = provider
    verification.provider_payload = payload
    verification.verified_at = timezone.now()
    verification.save(update_fields=["status", "provider", "provider_payload", "verified_at"])

    driver = verification.driver
    driver.is_kyc_verified = True
    driver.kyc_verified_at = verification.verified_at
    driver.save(update_fields=["is_kyc_verified", "kyc_verified_at"])

    expires_on = None
    raw_expiry = payload.get("expires_on")
    if raw_expiry:
        expires_on = parse_date(str(raw_expiry))
        if expires_on is None:
            # DigiLocker commonly returns dd-mm-yyyy
            try:
                day, month, year = str(raw_expiry).split("-")
                expires_on = parse_date(f"{year}-{month}-{day}")
            except ValueError:
                expires_on = None

    ComplianceDocument.objects.create(
        school=verification.school,
        owner_type="driver",
        owner_id=verification.driver_id,
        document_type=verification.doc_type,
        expires_on=expires_on,
    )


class DigiLockerInitiateView(APIView):
    """Start a verification for a driver.

    Real mode returns an authorize_url the driver must open to grant DigiLocker
    consent; mock mode (no credentials configured) verifies immediately.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.accounts.models import DriverProfile
        from apps.compliance.services import digilocker

        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)

        driver_id = request.data.get("driver_id")
        if not driver_id:
            return Response({"detail": "driver_id is required."}, status=400)
        try:
            driver = DriverProfile.objects.get(id=driver_id, school=school)
        except DriverProfile.DoesNotExist:
            return Response({"detail": "Driver not found."}, status=404)

        doc_type = request.data.get("doc_type", DigiLockerVerification.DocType.DRIVING_LICENSE)
        if doc_type not in DigiLockerVerification.DocType.values:
            return Response({"detail": f"doc_type must be one of {DigiLockerVerification.DocType.values}."}, status=400)

        verification = DigiLockerVerification.objects.create(
            school=school,
            driver=driver,
            doc_type=doc_type,
            document_number=request.data.get("document_number", ""),
            initiated_by=request.user,
        )

        if not digilocker.is_configured():
            payload = digilocker.mock_verify(doc_type, verification.document_number)
            _mark_verified(verification, payload, provider="mock")
            log.info("digilocker: mock-verified driver=%s doc=%s", driver.id, doc_type)
            return Response({**_verification_dict(verification), "authorize_url": None}, status=201)

        verification.status = DigiLockerVerification.Status.IN_PROGRESS
        verification.provider = "digilocker"
        verification.save(update_fields=["status", "provider"])
        authorize_url = digilocker.build_authorize_url(state=str(verification.request_id))
        log.info("digilocker: initiated driver=%s doc=%s request_id=%s", driver.id, doc_type, verification.request_id)
        return Response({**_verification_dict(verification), "authorize_url": authorize_url}, status=201)


class DigiLockerCallbackView(APIView):
    """OAuth redirect target — DigiLocker sends the driver here after consent."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from apps.compliance.services import digilocker

        code = request.query_params.get("code")
        state = request.query_params.get("state")
        error = request.query_params.get("error")

        if not state:
            return Response({"detail": "state is required."}, status=400)
        try:
            verification = DigiLockerVerification.objects.select_related("driver").get(request_id=state)
        except (DigiLockerVerification.DoesNotExist, ValueError):
            return Response({"detail": "Unknown verification request."}, status=404)

        if verification.status == DigiLockerVerification.Status.VERIFIED:
            return Response({"detail": "Already verified.", **_verification_dict(verification)})

        if error or not code:
            verification.status = DigiLockerVerification.Status.FAILED
            verification.failure_reason = error or "Consent was not granted."
            verification.save(update_fields=["status", "failure_reason"])
            return Response({"detail": "Verification failed.", **_verification_dict(verification)}, status=400)

        try:
            token = digilocker.exchange_code(code)
            payload = digilocker.fetch_document(token, verification.doc_type)
        except Exception as exc:
            log.warning("digilocker: callback failed request_id=%s error=%s", state, exc)
            verification.status = DigiLockerVerification.Status.FAILED
            verification.failure_reason = f"DigiLocker API error: {exc}"
            verification.save(update_fields=["status", "failure_reason"])
            return Response({"detail": "Verification failed.", **_verification_dict(verification)}, status=502)

        if not digilocker.numbers_match(verification.document_number, payload.get("document_number", "")):
            verification.status = DigiLockerVerification.Status.FAILED
            verification.failure_reason = "Document number does not match DigiLocker records."
            verification.provider_payload = payload
            verification.save(update_fields=["status", "failure_reason", "provider_payload"])
            return Response({"detail": "Document number mismatch.", **_verification_dict(verification)}, status=400)

        _mark_verified(verification, payload, provider="digilocker")
        return Response({"detail": "Verified.", **_verification_dict(verification)})


class DigiLockerVerificationListView(APIView):
    """List verifications for the school (optionally filtered by driver)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)

        qs = DigiLockerVerification.objects.filter(school=school)
        driver_id = request.query_params.get("driver_id")
        if driver_id:
            qs = qs.filter(driver_id=driver_id)

        return Response({"results": [_verification_dict(v) for v in qs[:200]]})
