from django.db.models import OuterRef, Prefetch, Subquery

from apps.tracking.models import LiveLocation, Trip


def tracking_queryset():
    latest_location_subquery = LiveLocation.objects.filter(trip_id=OuterRef("pk")).order_by("-created_at")
    return (
        Trip.objects.select_related("school", "route", "vehicle", "driver__user")
        .prefetch_related(Prefetch("locations", queryset=LiveLocation.objects.order_by("-created_at")))
        .annotate(latest_location_id=Subquery(latest_location_subquery.values("id")[:1]))
    )


def active_school_fleet_queryset(*, school_id):
    return tracking_queryset().filter(school_id=school_id, status=Trip.Status.ACTIVE)


def school_trip_queryset(*, school_id):
    return tracking_queryset().filter(school_id=school_id)
