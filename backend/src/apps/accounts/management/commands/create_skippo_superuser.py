from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()

SUPERUSER_EMAIL = "roysayak200@gmail.com"
SUPERUSER_PASSWORD = "@algo123RIK"


class Command(BaseCommand):
    help = "Ensure the Skippo superuser exists (idempotent — safe to run on every deploy)."

    def handle(self, *args, **options):
        user, created = User.objects.get_or_create(
            email=SUPERUSER_EMAIL,
            defaults=dict(username=SUPERUSER_EMAIL, is_staff=True, is_superuser=True),
        )
        user.is_staff = True
        user.is_superuser = True
        user.set_password(SUPERUSER_PASSWORD)
        user.save(update_fields=["is_staff", "is_superuser", "password"])

        if created:
            self.stdout.write(self.style.SUCCESS(f"Superuser created: {SUPERUSER_EMAIL}"))
        else:
            self.stdout.write(self.style.WARNING(f"Superuser already existed, credentials refreshed: {SUPERUSER_EMAIL}"))
