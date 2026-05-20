import re
import secrets
import string
import threading

from django.contrib.auth import get_user_model
from django.utils.text import slugify
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.tenancy.models import RegistrationInterest, School, TenantConfig
from integrations.email_service import notify_new_enquiry, notify_school_onboarded, send_school_welcome


def _generate_temp_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$"
    pwd = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice("!@#$"),
    ]
    pwd += [secrets.choice(alphabet) for _ in range(length - 4)]
    secrets.SystemRandom().shuffle(pwd)
    return "".join(pwd)


User = get_user_model()


class IsSuperUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)


def _serialize_interest(r):
    return {
        "id":           r.id,
        "enquiry_type": r.enquiry_type,
        "name":         r.name,
        "email":        r.email,
        "phone":        r.phone,
        "school_name":  r.school_name,
        "message":      r.message,
        "status":       r.status,
        "admin_notes":  r.admin_notes,
        "created_at":   r.created_at.isoformat(),
        "assigned_to":  {
            "id":    r.assigned_to.id,
            "name":  r.assigned_to.get_full_name() or r.assigned_to.email,
            "email": r.assigned_to.email,
        } if r.assigned_to else None,
    }


class RegistrationInterestCreateView(APIView):
    """Public — no auth required. Called from the website contact form."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip()
        if not name or not email:
            return Response({"detail": "name and email are required."}, status=400)

        phone   = data.get("phone", "")
        school  = data.get("school", "")
        message = data.get("message", "")
        enquiry = data.get("enquiry_type", "")

        interest = RegistrationInterest.objects.create(
            enquiry_type=enquiry,
            name=name,
            email=email,
            phone=phone,
            school_name=school,
            message=message,
        )

        threading.Thread(
            target=notify_new_enquiry,
            kwargs=dict(name=name, email=email, phone=phone, school=school,
                        message=message, enquiry_type=enquiry),
            daemon=True,
        ).start()

        return Response({"id": interest.id, "status": "received"}, status=201)


class RegistrationInterestListView(APIView):
    """Staff and superusers — list and update registration interests.

    Superusers see all leads. Staff see only their assigned leads.
    Only superusers can change assigned_to.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        qs = RegistrationInterest.objects.select_related("assigned_to").all()

        if not request.user.is_superuser:
            qs = qs.filter(assigned_to=request.user)

        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        return Response({"results": [_serialize_interest(r) for r in qs], "count": qs.count()})

    def patch(self, request, pk=None):
        if pk is None:
            return Response({"detail": "pk required"}, status=400)
        try:
            r = RegistrationInterest.objects.select_related("assigned_to").get(pk=pk)
        except RegistrationInterest.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)

        if "status" in request.data:
            r.status = request.data["status"]
        if "admin_notes" in request.data:
            r.admin_notes = request.data["admin_notes"]
        if "assigned_to" in request.data and request.user.is_superuser:
            assigned_id = request.data["assigned_to"]
            if assigned_id is None:
                r.assigned_to = None
            else:
                try:
                    r.assigned_to = User.objects.get(pk=assigned_id, is_staff=True)
                except User.DoesNotExist:
                    return Response({"detail": "Staff member not found."}, status=400)
        r.save()
        return Response(_serialize_interest(r))


class StaffManagementView(APIView):
    """Superuser only — create, list, and delete staff accounts."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsSuperUser]

    def get(self, request):
        staff = User.objects.filter(is_staff=True, is_superuser=False).order_by("email")
        data = [
            {
                "id":         u.id,
                "email":      u.email,
                "name":       u.get_full_name() or u.email,
                "lead_count": u.assigned_leads.count(),
            }
            for u in staff
        ]
        return Response({"results": data, "count": len(data)})

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        name  = (request.data.get("name") or "").strip()
        password = request.data.get("password", "").strip()
        if not email or not password:
            return Response({"detail": "email and password are required."}, status=400)

        if User.objects.filter(email__iexact=email).exists():
            return Response({"detail": "A user with this email already exists."}, status=400)

        first, _, last = name.partition(" ")
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first,
            last_name=last,
            is_staff=True,
            is_superuser=False,
        )
        return Response({
            "id":    user.id,
            "email": user.email,
            "name":  user.get_full_name() or user.email,
        }, status=201)

    def delete(self, request, pk=None):
        if pk is None:
            return Response({"detail": "pk required"}, status=400)
        try:
            user = User.objects.get(pk=pk, is_staff=True, is_superuser=False)
        except User.DoesNotExist:
            return Response({"detail": "Staff member not found."}, status=404)
        user.delete()
        return Response(status=204)


class SchoolProvisionView(APIView):
    """Staff and superusers — create a new school + first admin user."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        school_name = (request.data.get("school_name") or "").strip()
        admin_email = (request.data.get("admin_email") or "").strip()
        if not school_name or not admin_email:
            return Response({"detail": "school_name and admin_email are required."}, status=400)

        raw_slug = (request.data.get("school_slug") or slugify(school_name)).strip()
        slug = re.sub(r"[^a-z0-9-]", "", raw_slug.lower()) or slugify(school_name)

        base, n = slug, 1
        while School.objects.filter(slug=slug).exists():
            slug = f"{base}-{n}"
            n += 1

        school = School.objects.create(name=school_name, slug=slug)
        TenantConfig.objects.create(school=school)

        admin_name = (request.data.get("admin_name") or "").strip()
        first, _, last = admin_name.partition(" ")
        temp_password = _generate_temp_password()
        user, created = User.objects.get_or_create(
            email=admin_email,
            defaults=dict(
                username=admin_email,
                first_name=first,
                last_name=last,
                is_staff=False,
                default_school=school,
            ),
        )
        if not created:
            user.default_school = school
            user.save(update_fields=["default_school"])

        user.set_password(temp_password)
        user.save(update_fields=["password"])

        lead_id = request.data.get("lead_id")
        if lead_id:
            RegistrationInterest.objects.filter(pk=lead_id).update(status="onboarded")

        dashboard_url = f"https://dashboard.skippo.app/login?school={school.slug}"
        email_kwargs = dict(
            school_name=school_name,
            school_slug=slug,
            admin_email=admin_email,
            admin_name=admin_name,
            temp_password=temp_password,
            dashboard_url=dashboard_url,
        )
        threading.Thread(target=notify_school_onboarded, kwargs={**email_kwargs, "lead_id": lead_id}, daemon=True).start()
        threading.Thread(target=send_school_welcome, kwargs=email_kwargs, daemon=True).start()

        return Response({
            "school": {
                "id":            school.id,
                "name":          school.name,
                "slug":          school.slug,
                "dashboard_url": dashboard_url,
            },
            "admin": {
                "id":           user.id,
                "email":        user.email,
                "created":      created,
                "username":     admin_email,
                "temp_password": temp_password,
            },
        }, status=201)
