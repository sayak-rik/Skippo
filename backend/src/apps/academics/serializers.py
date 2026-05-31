from rest_framework import serializers

from apps.academics.models import (
    AcademicEvent,
    AcademicSession,
    AcademicYear,
    ClassSession,
    Exam,
    ExamResult,
    ExamSchedule,
    Holiday,
    Homework,
    House,
    ReportCard,
    Student,
    StudentDailyReport,
    StudentDocument,
    StudentProgress,
    Subject,
    Timetable,
    TimetableSlot,
    TransferCertificate,
)


# ── School Setup Serializers ───────────────────────────────────────────────────

class AcademicSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicSession
        fields = ("id", "name", "start_date", "end_date", "is_current", "created_at")


class AcademicYearSerializer(serializers.ModelSerializer):
    sessions = AcademicSessionSerializer(many=True, read_only=True)

    class Meta:
        model = AcademicYear
        fields = ("id", "name", "start_date", "end_date", "is_current", "sessions", "created_at")


class AcademicYearWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = ("name", "start_date", "end_date", "is_current")


class AcademicSessionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicSession
        fields = ("name", "start_date", "end_date", "is_current")


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ("id", "name", "code", "is_active", "created_at")


class HouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = House
        fields = ("id", "name", "color", "description", "is_active", "created_at")


class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = ("id", "academic_year_id", "name", "date", "holiday_type", "created_at")


class AcademicEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicEvent
        fields = ("id", "academic_year_id", "title", "description", "start_date", "end_date", "event_type", "created_at")


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


# ── Student Management Serializers ─────────────────────────────────────────────

class StudentAdmissionSerializer(serializers.ModelSerializer):
    """Write serializer for creating / updating a student (full admission form)."""
    class Meta:
        model = Student
        fields = (
            "full_name", "date_of_birth", "gender", "blood_group", "category",
            "religion", "nationality", "classroom", "roll_number", "house",
            "admission_date", "address", "emergency_contact_name",
            "emergency_contact_phone", "pending_parent_phone", "pending_parent_name",
        )


class StudentDetailSerializer(serializers.ModelSerializer):
    """Read serializer for a full student profile."""
    classroom_name    = serializers.CharField(source="classroom.name",    read_only=True, default="")
    classroom_section = serializers.CharField(source="classroom.section", read_only=True, default="")
    house_name        = serializers.CharField(source="house.name",        read_only=True, default="")
    house_color       = serializers.CharField(source="house.color",       read_only=True, default="")

    class Meta:
        model = Student
        fields = (
            "id", "full_name", "admission_number", "date_of_birth", "gender",
            "blood_group", "category", "religion", "nationality", "photo_key",
            "classroom", "classroom_name", "classroom_section", "roll_number",
            "house", "house_name", "house_color", "admission_date", "is_active",
            "address", "emergency_contact_name", "emergency_contact_phone",
            "pending_parent_phone", "pending_parent_name", "created_at",
        )


class StudentDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentDocument
        fields = ("id", "document_type", "file_name", "file_key", "created_at")


class TransferCertificateSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)

    class Meta:
        model = TransferCertificate
        fields = ("id", "tc_number", "student_id", "student_name", "issued_date", "reason", "remark", "created_at")


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


# ── Module C: Timetable ────────────────────────────────────────────────────────

class TimetableSlotSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True, default="")
    teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = TimetableSlot
        fields = (
            "id", "weekday", "period_number", "starts_at", "ends_at",
            "slot_type", "subject", "subject_name", "teacher", "teacher_name",
        )

    def get_teacher_name(self, obj):
        if obj.teacher and obj.teacher.user:
            return obj.teacher.user.get_full_name() or obj.teacher.user.email
        return ""


class TimetableSerializer(serializers.ModelSerializer):
    slots = TimetableSlotSerializer(many=True, read_only=True)
    classroom_name = serializers.CharField(source="classroom.name", read_only=True)

    class Meta:
        model = Timetable
        fields = ("id", "classroom", "classroom_name", "academic_year", "label", "is_active", "slots", "created_at")


class TimetableWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Timetable
        fields = ("classroom", "academic_year", "label", "is_active")
        extra_kwargs = {
            "label": {"required": False, "allow_blank": True, "default": "Regular"},
        }


# ── Module C: Homework ─────────────────────────────────────────────────────────

class HomeworkSerializer(serializers.ModelSerializer):
    subject_name   = serializers.CharField(source="subject.name",   read_only=True, default="")
    classroom_name = serializers.CharField(source="classroom.name", read_only=True, default="")
    teacher_name   = serializers.SerializerMethodField()

    class Meta:
        model = Homework
        fields = (
            "id", "classroom", "classroom_name", "subject", "subject_name",
            "teacher", "teacher_name", "title", "description",
            "assigned_date", "due_date", "is_active", "created_at",
        )

    def get_teacher_name(self, obj):
        if obj.teacher and obj.teacher.user:
            return obj.teacher.user.get_full_name() or ""
        return ""


class HomeworkWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Homework
        fields = ("classroom", "subject", "title", "description", "assigned_date", "due_date", "is_active")


# ── Module C: Exams ────────────────────────────────────────────────────────────

class ExamScheduleSerializer(serializers.ModelSerializer):
    subject_name   = serializers.CharField(source="subject.name",   read_only=True)
    classroom_name = serializers.CharField(source="classroom.name", read_only=True)

    class Meta:
        model = ExamSchedule
        fields = (
            "id", "exam", "classroom", "classroom_name", "subject", "subject_name",
            "date", "starts_at", "ends_at", "max_marks", "passing_marks",
        )


class ExamSerializer(serializers.ModelSerializer):
    schedules = ExamScheduleSerializer(many=True, read_only=True)

    class Meta:
        model = Exam
        fields = (
            "id", "name", "exam_type", "academic_year",
            "start_date", "end_date", "is_published", "schedules", "created_at",
        )


class ExamWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exam
        fields = ("name", "exam_type", "academic_year", "start_date", "end_date", "is_published")


class ExamResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    roll_number  = serializers.CharField(source="student.roll_number", read_only=True)

    class Meta:
        model = ExamResult
        fields = (
            "id", "exam_schedule", "student", "student_name", "roll_number",
            "marks_obtained", "is_absent", "grade",
        )


# ── Module C: Report Cards ─────────────────────────────────────────────────────

class ReportCardSerializer(serializers.ModelSerializer):
    student_name  = serializers.CharField(source="student.full_name",    read_only=True)
    admission_no  = serializers.CharField(source="student.admission_number", read_only=True)
    classroom_name = serializers.SerializerMethodField()
    exam_name     = serializers.CharField(source="exam.name",            read_only=True)

    class Meta:
        model = ReportCard
        fields = (
            "id", "student", "student_name", "admission_no", "classroom_name",
            "exam", "exam_name", "academic_year",
            "total_marks", "obtained_marks", "percentage", "grade", "rank",
            "remarks", "is_published", "generated_at",
        )

    def get_classroom_name(self, obj):
        if obj.student.classroom:
            return f"{obj.student.classroom.name}{' ' + obj.student.classroom.section if obj.student.classroom.section else ''}"
        return ""
