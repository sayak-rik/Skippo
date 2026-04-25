from django.db import models

from common.models import SchoolScopedModel, TimestampedModel


class Classroom(SchoolScopedModel):
    name = models.CharField(max_length=128)
    section = models.CharField(max_length=32, blank=True)
    teacher = models.ForeignKey("accounts.TeacherProfile", null=True, blank=True, on_delete=models.SET_NULL)


class Student(SchoolScopedModel):
    full_name = models.CharField(max_length=255)
    classroom = models.ForeignKey(Classroom, null=True, blank=True, on_delete=models.SET_NULL)
    roll_number = models.CharField(max_length=32, blank=True)
    parents = models.ManyToManyField(
        "accounts.ParentProfile",
        through="StudentParentLink",
        related_name="students",
        blank=True,
    )


class StudentParentLink(TimestampedModel):
    """Maps one or more parents to a student.

    A student can have multiple parents (e.g. mother and father both linked).
    is_primary marks the parent who receives transport / attendance notifications.
    source records how the link was created for audit purposes.
    """

    class Source(models.TextChoices):
        ADMIN = "admin", "Admin"
        QR_SCAN = "qr_scan", "QR Scan"
        DIRECT = "direct", "Direct"

    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="parent_links")
    parent = models.ForeignKey(
        "accounts.ParentProfile", on_delete=models.CASCADE, related_name="student_links"
    )
    is_primary = models.BooleanField(default=True)
    source = models.CharField(max_length=16, choices=Source.choices, default=Source.ADMIN)

    class Meta:
        unique_together = [("student", "parent")]


class ClassSession(SchoolScopedModel):
    class AttendanceBoundary(models.TextChoices):
        NONE = "none", "None"
        SCHOOL_ENTRY = "school_entry", "School Entry"
        SCHOOL_EXIT = "school_exit", "School Exit"

    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name="sessions")
    teacher = models.ForeignKey("accounts.TeacherProfile", null=True, blank=True, on_delete=models.SET_NULL)
    title = models.CharField(max_length=128)
    weekday = models.PositiveSmallIntegerField(default=1)
    starts_at = models.TimeField()
    ends_at = models.TimeField()
    sequence = models.PositiveSmallIntegerField(default=1)
    attendance_boundary = models.CharField(
        max_length=32,
        choices=AttendanceBoundary.choices,
        default=AttendanceBoundary.NONE,
    )
    is_active = models.BooleanField(default=True)


class StudentAttendance(TimestampedModel):
    class AttendanceEvent(models.TextChoices):
        PRESENT = "present", "Present"
        ABSENT = "absent", "Absent"
        SCHOOL_ENTRY = "school_entry", "School Entry"
        SCHOOL_EXIT = "school_exit", "School Exit"

    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    classroom = models.ForeignKey(Classroom, null=True, blank=True, on_delete=models.SET_NULL)
    session = models.ForeignKey(ClassSession, null=True, blank=True, on_delete=models.SET_NULL)
    teacher = models.ForeignKey("accounts.TeacherProfile", null=True, blank=True, on_delete=models.SET_NULL)
    date = models.DateField()
    is_present = models.BooleanField(default=False)
    event_type = models.CharField(max_length=32, choices=AttendanceEvent.choices, default=AttendanceEvent.PRESENT)
    marked_at = models.DateTimeField(auto_now_add=True)


class StudentProgress(TimestampedModel):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    classroom = models.ForeignKey(Classroom, null=True, blank=True, on_delete=models.SET_NULL)
    session = models.ForeignKey(ClassSession, null=True, blank=True, on_delete=models.SET_NULL)
    teacher = models.ForeignKey("accounts.TeacherProfile", null=True, blank=True, on_delete=models.SET_NULL)
    category = models.CharField(max_length=64, default="general")
    note = models.TextField()
    is_read_by_parent = models.BooleanField(default=False)
    parent_read_at = models.DateTimeField(null=True, blank=True)


class StudentDailyReport(TimestampedModel):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    date = models.DateField()
    attendance_summary = models.CharField(max_length=255, blank=True)
    teacher_comment_summary = models.TextField(blank=True)
    unread_comment_count = models.PositiveIntegerField(default=0)
    parent_notified_at = models.DateTimeField(null=True, blank=True)


class ClassBroadcast(TimestampedModel):
    """A class-wide message broadcast by a teacher to all parents in the classroom.

    When a teacher sends a broadcast from the Attendance screen, a push notification
    is fanned out to every parent whose child is in the session's classroom.  The
    record here provides an audit trail and allows the teacher to review past
    broadcasts for the class.
    """

    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)
    session = models.ForeignKey(ClassSession, on_delete=models.CASCADE, related_name="broadcasts")
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name="broadcasts")
    teacher = models.ForeignKey(
        "accounts.TeacherProfile", null=True, blank=True, on_delete=models.SET_NULL
    )
    message = models.TextField()


class AssistRequest(TimestampedModel):
    """A doubt or help request raised by a parent from the parent app.

    Parents can raise a card on any student's profile asking the teacher a question.
    Teachers see open requests inside the student's card on the Attendance screen
    and can resolve them with an optional reply that is visible back in the parent app.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        RESOLVED = "resolved", "Resolved"

    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="assist_requests")
    session = models.ForeignKey(
        ClassSession, null=True, blank=True, on_delete=models.SET_NULL, related_name="assist_requests"
    )
    classroom = models.ForeignKey(
        Classroom, null=True, blank=True, on_delete=models.SET_NULL, related_name="assist_requests"
    )
    question = models.TextField()
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.PENDING)
    resolved_by = models.ForeignKey(
        "accounts.TeacherProfile", null=True, blank=True, on_delete=models.SET_NULL
    )
    teacher_reply = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)


# ── AI Teaching Assistant ──────────────────────────────────────────────────────

class TeacherAITokenUsage(TimestampedModel):
    """Tracks daily Gemini token consumption per teacher. Resets each calendar day."""

    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)
    teacher = models.ForeignKey("accounts.TeacherProfile", on_delete=models.CASCADE)
    date = models.DateField()
    tokens_used = models.PositiveSmallIntegerField(default=0)

    class Meta:
        unique_together = [("teacher", "date")]


class LessonPlan(TimestampedModel):
    """AI-generated lesson plan for a classroom session."""

    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)
    teacher = models.ForeignKey("accounts.TeacherProfile", on_delete=models.CASCADE)
    classroom = models.ForeignKey(Classroom, null=True, blank=True, on_delete=models.SET_NULL)
    subject = models.CharField(max_length=128)
    topic = models.CharField(max_length=255)
    duration_minutes = models.PositiveSmallIntegerField(default=45)
    content = models.TextField()


class ClassSummary(TimestampedModel):
    """AI-generated end-of-session summary for a classroom."""

    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)
    teacher = models.ForeignKey("accounts.TeacherProfile", on_delete=models.CASCADE)
    classroom = models.ForeignKey(Classroom, null=True, blank=True, on_delete=models.SET_NULL)
    date = models.DateField()
    summary_text = models.TextField()
    weak_students = models.JSONField(default=list)
    revision_topics = models.JSONField(default=list)


class TeacherVoiceObservation(TimestampedModel):
    """A voice note spoken by a teacher, transcribed and stored as a student observation."""

    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)
    teacher = models.ForeignKey("accounts.TeacherProfile", on_delete=models.CASCADE)
    student = models.ForeignKey(Student, null=True, blank=True, on_delete=models.SET_NULL)
    classroom = models.ForeignKey(Classroom, null=True, blank=True, on_delete=models.SET_NULL)
    raw_transcript = models.TextField()
    structured_note = models.TextField()
    category = models.CharField(max_length=64, default="observation")
