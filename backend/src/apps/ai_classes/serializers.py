from rest_framework import serializers

from .models import AIClass, ClassFeedback, StudentClassToken


class AIClassListSerializer(serializers.ModelSerializer):
    feedback_count = serializers.SerializerMethodField()
    avg_rating     = serializers.SerializerMethodField()

    class Meta:
        model = AIClass
        fields = [
            "id", "title", "subject", "status", "scheduled_at",
            "pod_url", "ended_at", "feedback_count", "avg_rating",
            "created_at",
        ]

    def get_feedback_count(self, obj):
        return obj.feedback.count()

    def get_avg_rating(self, obj):
        ratings = list(obj.feedback.values_list("rating", flat=True))
        return round(sum(ratings) / len(ratings), 1) if ratings else None


class AIClassDetailSerializer(serializers.ModelSerializer):
    feedback_count = serializers.SerializerMethodField()
    avg_rating     = serializers.SerializerMethodField()
    student_count  = serializers.SerializerMethodField()

    class Meta:
        model = AIClass
        fields = [
            "id", "title", "subject", "instructions", "status",
            "scheduled_at", "classroom", "pod_url", "machine_id",
            "ended_at", "class_summary", "feedback_count", "avg_rating",
            "student_count", "created_at", "updated_at",
        ]

    def get_feedback_count(self, obj):
        return obj.feedback.count()

    def get_avg_rating(self, obj):
        ratings = list(obj.feedback.values_list("rating", flat=True))
        return round(sum(ratings) / len(ratings), 1) if ratings else None

    def get_student_count(self, obj):
        return obj.tokens.count()


class AIClassWriteSerializer(serializers.ModelSerializer):
    classroom_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = AIClass
        fields = ["title", "subject", "instructions", "classroom_id", "scheduled_at"]

    def validate_instructions(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Instructions must be at least 10 characters.")
        return value


class StudentTokenSerializer(serializers.ModelSerializer):
    join_url     = serializers.SerializerMethodField()
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    class_id     = serializers.IntegerField(source="ai_class.id", read_only=True)
    class_title  = serializers.CharField(source="ai_class.title", read_only=True)
    subject      = serializers.CharField(source="ai_class.subject", read_only=True)
    class_status = serializers.CharField(source="ai_class.status", read_only=True)
    scheduled_at = serializers.DateTimeField(source="ai_class.scheduled_at", read_only=True)

    class Meta:
        model = StudentClassToken
        fields = [
            "id", "student", "student_name", "token", "join_url",
            "class_id", "class_title", "subject", "class_status", "scheduled_at",
        ]

    def get_join_url(self, obj):
        pod_url = obj.ai_class.pod_url
        if not pod_url:
            return None
        return obj.build_join_url(pod_url)


class ClassFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassFeedback
        fields = ["id", "student_name", "rating", "comment", "submitted_at", "created_at"]
