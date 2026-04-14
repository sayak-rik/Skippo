from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from common.demo_state import login_payload


class AccountsRootView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"module": "accounts", "status": "ready", "mode": "demo"})


class DemoLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        role = request.data.get("role")
        if role not in {"parent", "driver", "teacher"}:
            return Response({"detail": "Unsupported role."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(login_payload(role), status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        role = request.query_params.get("role", "parent")
        if role not in {"parent", "driver", "teacher"}:
            return Response({"detail": "Unsupported role."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(login_payload(role))
