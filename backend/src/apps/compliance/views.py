from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.compliance.models import RenewalReminder


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
