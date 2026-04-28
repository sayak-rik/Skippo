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
from integrations.email_service import notify_new_enquiry


def _generate_temp_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$"
    # Guarantee at least one of each required class
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

        # Notify the team via the email microservice — runs in a daemon thread
        # so it never blocks the API response.
        threading.Thread(
            target=notify_new_enquiry,
            kwargs=dict(name=name, email=email, phone=phone, school=school,
                        message=message, enquiry_type=enquiry),
            daemon=True,
        ).start()

        return Response({"id": interest.id, "status": "received"}, status=201)


class RegistrationInterestListView(APIView):
    """Superuser only — list and update registration interests."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        qs = RegistrationInterest.objects.all()
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        items = [
            {
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
            }
            for r in qs
        ]
        return Response({"results": items, "count": len(items)})

    def patch(self, request, pk=None):
        if pk is None:
            return Response({"detail": "pk required"}, status=400)
        try:
            r = RegistrationInterest.objects.get(pk=pk)
        except RegistrationInterest.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)

        if "status" in request.data:
            r.status = request.data["status"]
        if "admin_notes" in request.data:
            r.admin_notes = request.data["admin_notes"]
        r.save()
        return Response({"id": r.id, "status": r.status})


class SchoolProvisionView(APIView):
    """Superuser only — create a new school + first admin user.

    POST body:
        school_name  (str) — display name
        school_slug  (str, optional) — auto-derived from name if omitted
        admin_email  (str)
        admin_name   (str, optional)
        lead_id      (int, optional) — if given, marks the lead as onboarded
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        school_name = (request.data.get("school_name") or "").strip()
        admin_email = (request.data.get("admin_email") or "").strip()
        if not school_name or not admin_email:
            return Response({"detail": "school_name and admin_email are required."}, status=400)

        raw_slug = (request.data.get("school_slug") or slugify(school_name)).strip()
        slug = re.sub(r"[^a-z0-9-]", "", raw_slug.lower()) or slugify(school_name)

        # Ensure slug uniqueness
        base, n = slug, 1
        while School.objects.filter(slug=slug).exists():
            slug = f"{base}-{n}"
            n += 1

        school = School.objects.create(name=school_name, slug=slug)
        TenantConfig.objects.create(school=school)

        # Create or fetch admin user
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

        # Always (re)set the temp password so the caller can share it
        user.set_password(temp_password)
        user.save(update_fields=["password"])

        # Mark lead as onboarded if provided
        lead_id = request.data.get("lead_id")
        if lead_id:
            RegistrationInterest.objects.filter(pk=lead_id).update(status="onboarded")

        return Response({
            "school": {
                "id": school.id,
                "name": school.name,
                "slug": school.slug,
                "dashboard_url": f"https://dashboard.skippo.app/login?school={school.slug}",
            },
            "admin": {
                "id": user.id,
                "email": user.email,
                "created": created,
                "username": admin_email,
                "temp_password": temp_password,
            },
        }, status=201)
