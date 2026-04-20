import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("accounts", "0001_initial"),
        ("academics", "0001_initial"),
        ("tenancy", "0001_initial"),
    ]

    operations = [
        # ── Vehicle ──────────────────────────────────────────────────────────
        migrations.CreateModel(
            name="Vehicle",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("registration_number", models.CharField(max_length=32, unique=True)),
                ("vehicle_type", models.CharField(default="bus", max_length=32)),
                ("capacity", models.PositiveIntegerField(default=0)),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="tenancy.school",
                    ),
                ),
            ],
            options={"abstract": False},
        ),

        # ── Route ─────────────────────────────────────────────────────────────
        migrations.CreateModel(
            name="Route",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=255)),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="tenancy.school",
                    ),
                ),
                (
                    "vehicle",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="transport.vehicle",
                    ),
                ),
            ],
            options={"abstract": False},
        ),

        # ── Stop ──────────────────────────────────────────────────────────────
        migrations.CreateModel(
            name="Stop",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=255)),
                ("latitude", models.DecimalField(decimal_places=6, max_digits=9)),
                ("longitude", models.DecimalField(decimal_places=6, max_digits=9)),
                ("sequence", models.PositiveIntegerField(default=0)),
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
                        related_name="stops",
                        to="transport.route",
                    ),
                ),
            ],
            options={"abstract": False},
        ),

        # ── DriverVehicleAssignment ───────────────────────────────────────────
        migrations.CreateModel(
            name="DriverVehicleAssignment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("contact_phone", models.CharField(blank=True, max_length=20)),
                ("is_active", models.BooleanField(default=True)),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="tenancy.school",
                    ),
                ),
                (
                    "driver",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="accounts.driverprofile",
                    ),
                ),
                (
                    "vehicle",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="transport.vehicle",
                    ),
                ),
            ],
            options={"abstract": False},
        ),

        # ── Trip ──────────────────────────────────────────────────────────────
        migrations.CreateModel(
            name="Trip",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("shift", models.CharField(default="morning", max_length=32)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("scheduled", "Scheduled"),
                            ("active", "Active"),
                            ("completed", "Completed"),
                            ("cancelled", "Cancelled"),
                        ],
                        default="scheduled",
                        max_length=32,
                    ),
                ),
                ("started_at", models.DateTimeField(blank=True, null=True)),
                ("ended_at", models.DateTimeField(blank=True, null=True)),
                ("boarded_count", models.PositiveIntegerField(default=0)),
                ("total_count", models.PositiveIntegerField(default=0)),
                ("missed_drops", models.JSONField(blank=True, default=list)),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="transport_trips",
                        to="tenancy.school",
                    ),
                ),
                (
                    "route",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="transport_trips",
                        to="transport.route",
                    ),
                ),
                (
                    "vehicle",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="transport_trips",
                        to="transport.vehicle",
                    ),
                ),
                (
                    "driver",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="transport_trips",
                        to="accounts.driverprofile",
                    ),
                ),
            ],
            options={"abstract": False},
        ),

        # ── TripLocationPing ──────────────────────────────────────────────────
        migrations.CreateModel(
            name="TripLocationPing",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("latitude", models.DecimalField(decimal_places=6, max_digits=9)),
                ("longitude", models.DecimalField(decimal_places=6, max_digits=9)),
                ("speed", models.FloatField(default=0)),
                ("heading", models.FloatField(default=0)),
                ("accuracy", models.FloatField(default=0)),
                (
                    "trip",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="location_pings",
                        to="transport.trip",
                    ),
                ),
            ],
            options={"abstract": False},
        ),

        # ── StudentStopOverride ───────────────────────────────────────────────
        migrations.CreateModel(
            name="StudentStopOverride",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("stop_name", models.CharField(max_length=255)),
                ("latitude", models.DecimalField(decimal_places=6, max_digits=9)),
                ("longitude", models.DecimalField(decimal_places=6, max_digits=9)),
                ("confirmed_by_parent", models.BooleanField(default=False)),
                ("confirmed_by_driver", models.BooleanField(default=False)),
                ("is_auto_assigned", models.BooleanField(default=False)),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="tenancy.school",
                    ),
                ),
                (
                    "student",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="stop_overrides",
                        to="academics.student",
                    ),
                ),
            ],
            options={"abstract": False},
        ),
    ]
