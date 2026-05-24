from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.communications.models import MessageCampaign, MessageReceipt


class CommunicationsRootView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"module": "communications", "status": "ready", "mode": "live"})


class ParentFeedView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if request.user and request.user.is_authenticated:
            receipts = (
                MessageReceipt.objects.filter(user=request.user)
                .select_related("campaign")
                .order_by("-created_at")[:50]
            )
            results = [
                {
                    "id": r.id,
                    "title": r.campaign.title,
                    "body": r.campaign.body,
                    "category": r.campaign.category,
                    "isRead": r.is_read,
                    "createdAt": str(r.created_at),
                }
                for r in receipts
            ]
        else:
            campaigns = MessageCampaign.objects.order_by("-created_at")[:50]
            results = [
                {
                    "id": c.id,
                    "title": c.title,
                    "body": c.body,
                    "category": c.category,
                    "isRead": False,
                    "createdAt": str(c.created_at),
                }
                for c in campaigns
            ]
        return Response({"results": results})
