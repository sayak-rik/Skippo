from rest_framework import serializers

from apps.tracking.models import LiveLocation, Trip


class LiveLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiveLocation
        fields = (
            "id",
            "trip_id",
            "latitude",
            "longitude",
            "speed",
            "heading",
            "accuracy",
            "provider",
            "created_at",
        )


class TripTrackingSerializer(serializers.ModelSerializer):
    latest_location = serializers.SerializerMethodField()
    route_name = serializers.CharField(source="route.name", read_only=True)
    vehicle_registration_number = serializers.CharField(
        source="vehicle.registration_number",
        read_only=True,
    )
    driver_username = serializers.CharField(source="driver.user.username", read_only=True)

    class Meta:
        model = Trip
        fields = (
            "id",
            "school_id",
            "route_id",
            "route_name",
            "vehicle_id",
            "vehicle_registration_number",
            "driver_id",
            "driver_username",
            "status",
            "started_at",
            "ended_at",
            "latest_location",
        )

    def get_latest_location(self, obj):
        latest = getattr(obj, "latest_location", None)
        if latest is None:
            latest = obj.locations.order_by("-created_at").first()
        if latest is None:
            return None
        return LiveLocationSerializer(latest).data
