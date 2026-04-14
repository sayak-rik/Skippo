from rest_framework import serializers

from apps.academics.models import ClassSession, Student, StudentDailyReport, StudentProgress


class ClassSessionSerializer(serializers.ModelSerializer):
    classroom_label = serializers.SerializerMethodField()
    is_current = serializers.BooleanField(read_only=True)

    class Meta:
        model = ClassSession
        fields = (
            "id",
            "classroom_id",
            "classroom_label",
            "title",
            "weekday",
            "starts_at",
            "ends_at",
            "sequence",
            "attendance_boundary",
            "is_current",
        )

    def get_classroom_label(self, obj):
        return f"{obj.classroom.name}{(' ' + obj.classroom.section) if obj.classroom.section else ''}"


class StudentRosterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ("id", "full_name", "roll_number")


class StudentProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProgress
        fields = (
            "id",
            "student_id",
            "classroom_id",
            "session_id",
            "category",
            "note",
            "is_read_by_parent",
            "created_at",
        )


class StudentDailyReportSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)

    class Meta:
        model = StudentDailyReport
        fields = (
            "id",
            "student_id",
            "student_name",
            "date",
            "attendance_summary",
            "teacher_comment_summary",
            "unread_comment_count",
            "parent_notified_at",
        )
