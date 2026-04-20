import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("accounts", "0001_initial"),
        ("tenancy", "0001_initial"),
        ("transport", "0001_initial"),
    ]

    operations = [
        # ── Trip ──────────────────────────────────────────────────────────────
        migrations.CreateModel(
            name="Trip",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("scheduled", "Scheduled"),
                            ("active", "Active"),
                            ("completed", "Completed"),
                        ],
                        default="scheduled",
                        max_length=20,
                    ),
                ),
                ("started_at", models.DateTimeField(blank=True, null=True)),
                ("ended_at", models.DateTimeField(blank=True, null=True)),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="tenancy.school",
                    ),
                ),
                (
                    "route",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tracking_trips",
                        to="transport.route",
                    ),
                ),
                (
                    "vehicle",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tracking_trips",
                        to="transport.vehicle",
                    ),
                ),
                (
                    "driver",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tracking_trips",
                        to="accounts.driverprofile",
                    ),
                ),
            ],
            options={"abstract": False},
        ),

        # ── LiveLocation ──────────────────────────────────────────────────────
        migrations.CreateModel(
            name="LiveLocation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("latitude", models.DecimalField(decimal_places=6, max_digits=9)),
                ("longitude", models.DecimalField(decimal_places=6, max_digits=9)),
                ("speed", models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True)),
                ("heading", models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True)),
                ("accuracy", models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True)),
                ("provider", models.CharField(default="google_maps", max_length=32)),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="tenancy.school",
                    ),
                ),
                (
                    "trip",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="locations",
                        to="tracking.trip",
                    ),
                ),
            ],
            options={"abstract": False, "ordering": ["-created_at"]},
        ),
    ]
