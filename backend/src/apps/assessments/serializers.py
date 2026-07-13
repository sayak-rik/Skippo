from rest_framework import serializers

from apps.assessments.models import (
    OnlineTest,
    ProctoringLog,
    StudentTestToken,
    TestQuestion,
    TestResult,
)


# ── Questions ──────────────────────────────────────────────────────────────────

class TestQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestQuestion
        fields = (
            "id", "order", "question_text", "question_type",
            "options", "correct_answer", "points", "voice_grading_hint",
            "created_at",
        )


class TestQuestionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestQuestion
        fields = (
            "order", "question_text", "question_type",
            "options", "correct_answer", "points", "voice_grading_hint",
        )


# ── Online Test ────────────────────────────────────────────────────────────────

class OnlineTestListSerializer(serializers.ModelSerializer):
    subject_name   = serializers.CharField(source="subject.name", default=None, read_only=True)
    question_count = serializers.IntegerField(source="questions.count", read_only=True)
    total_points   = serializers.IntegerField(read_only=True)

    class Meta:
        model = OnlineTest
        fields = (
            "id", "title", "subject_name", "test_type", "status",
            "duration_minutes", "available_from", "available_until",
            "enable_proctoring", "question_count", "total_points",
            "created_at",
        )


class OnlineTestDetailSerializer(serializers.ModelSerializer):
    subject_name   = serializers.CharField(source="subject.name", default=None, read_only=True)
    classroom_ids  = serializers.PrimaryKeyRelatedField(source="classrooms", many=True, read_only=True)
    questions      = TestQuestionSerializer(many=True, read_only=True)
    total_points   = serializers.IntegerField(read_only=True)

    class Meta:
        model = OnlineTest
        fields = (
            "id", "title", "subject_name", "classroom_ids", "test_type", "status",
            "duration_minutes", "passing_percentage", "enable_proctoring", "enable_voice_tts",
            "instructions", "available_from", "available_until",
            "questions", "total_points", "lb_test_id", "created_at",
        )


class OnlineTestWriteSerializer(serializers.ModelSerializer):
    classroom_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True)

    class Meta:
        model = OnlineTest
        fields = (
            "title", "subject", "classroom_ids", "academic_year",
            "test_type", "duration_minutes", "passing_percentage",
            "enable_proctoring", "enable_voice_tts",
            "instructions", "available_from", "available_until",
        )


# ── Proctoring ─────────────────────────────────────────────────────────────────

class ProctoringLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProctoringLog
        fields = ("id", "event_type", "severity", "occurred_at")


# ── Results ────────────────────────────────────────────────────────────────────

class TestResultSerializer(serializers.ModelSerializer):
    student_name      = serializers.CharField(source="student.full_name", read_only=True)
    proctoring_events = ProctoringLogSerializer(many=True, read_only=True)

    class Meta:
        model = TestResult
        fields = (
            "id", "student_name", "score", "max_score", "percentage", "grade",
            "time_taken_seconds", "completion_reason", "is_published",
            "completed_at", "proctoring_events",
        )


class TestResultDetailSerializer(TestResultSerializer):
    class Meta(TestResultSerializer.Meta):
        fields = TestResultSerializer.Meta.fields + ("answers",)


# ── Tokens (parent-facing) ─────────────────────────────────────────────────────

class TestAccessSerializer(serializers.ModelSerializer):
    test_id          = serializers.IntegerField(source="test.id", read_only=True)
    test_title       = serializers.CharField(source="test.title", read_only=True)
    test_type        = serializers.CharField(source="test.test_type", read_only=True)
    duration_minutes = serializers.IntegerField(source="test.duration_minutes", read_only=True)
    available_from   = serializers.DateTimeField(source="test.available_from", read_only=True)
    available_until  = serializers.DateTimeField(source="test.available_until", read_only=True)
    instructions     = serializers.CharField(source="test.instructions", read_only=True)

    class Meta:
        model = StudentTestToken
        fields = (
            "token", "test_id", "test_title", "test_type", "duration_minutes",
            "available_from", "available_until", "instructions",
            "is_used", "pod_url", "session_id", "expires_at",
        )
