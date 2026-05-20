from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("tenancy", "0003_registrationinterest"),
    ]

    operations = [
        migrations.AddField(
            model_name="registrationinterest",
            name="assigned_to",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="assigned_leads",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
