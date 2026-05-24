from django.conf import settings
from django.db import models

from common.models import SchoolScopedModel, TimestampedModel


# ── School Setup: Academic Years ───────────────────────────────────────────────

class AcademicYear(SchoolScopedModel):
    """A school's top-level academic year, e.g. "2025-26"."""
    name = models.CharField(max_length=32)          # "2025-26"
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta:
        unique_together = [("school", "name")]
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.school_id} | {self.name}"


class AcademicSession(SchoolScopedModel):
    """A term/session within an academic year, e.g. "Term 1", "Semester 2"."""
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name="sessions")
    name = models.CharField(max_length=64)          # "Term 1", "Semester 1"
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta:
        unique_together = [("academic_year", "name")]
        ordering = ["start_date"]


# ── School Setup: Subjects ─────────────────────────────────────────────────────

class Subject(SchoolScopedModel):
    name = models.CharField(max_length=128)         # "Mathematics"
    code = models.CharField(max_length=16, blank=True)  # "MATH"
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = [("school", "name")]
        ordering = ["name"]


# ── School Setup: Houses / Groups ─────────────────────────────────────────────

class House(SchoolScopedModel):
    name = models.CharField(max_length=64)          # "Red House"
    color = models.CharField(max_length=7, default="#6366f1")  # hex
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = [("school", "name")]
        ordering = ["name"]


# ── School Setup: Calendar — Holidays & Events ────────────────────────────────

class Holiday(SchoolScopedModel):
    class HolidayType(models.TextChoices):
        NATIONAL = "national", "National"
        REGIONAL = "regional", "Regional"
        SCHOOL = "school", "School"

    academic_year = models.ForeignKey(AcademicYear, null=True, blank=True, on_delete=models.SET_NULL, related_name="holidays")
    name = models.CharField(max_length=128)
    date = models.DateField()
    holiday_type = models.CharField(max_length=16, choices=HolidayType.choices, default=HolidayType.SCHOOL)

    class Meta:
        ordering = ["date"]


class AcademicEvent(SchoolScopedModel):
    class EventType(models.TextChoices):
        EXAM = "exam", "Exam"
        SPORTS = "sports", "Sports"
        CULTURAL = "cultural", "Cultural"
        PARENT_MEETING = "parent_meeting", "Parent Meeting"
        OTHER = "other", "Other"

    academic_year = models.ForeignKey(AcademicYear, null=True, blank=True, on_delete=models.SET_NULL, related_name="events")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    event_type = models.CharField(max_length=24, choices=EventType.choices, default=EventType.OTHER)

    class Meta:
        ordering = ["start_date"]


class Classroom(SchoolScopedModel):
    name = models.CharField(max_length=128)
    section = models.CharField(max_length=32, blank=True)
    teacher = models.ForeignKey("accounts.TeacherProfile", null=True, blank=True, on_delete=models.SET_NULL)


def _next_admission_number(school):
    """Generate the next sequential admission number for a school."""
    from django.utils import timezone
    year = timezone.now().year
    prefix = f"{school.slug.upper()[:6]}/{year}/"
    last = (
        Student.objects
        .filter(school=school, admission_number__startswith=prefix)
        .order_by("-admission_number")
        .values_list("admission_number", flat=True)
        .first()
    )
    if last:
        try:
            seq = int(last.split("/")[-1]) + 1
        except (ValueError, IndexError):
            seq = 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


class Student(SchoolScopedModel):
    class Gender(models.TextChoices):
        MALE   = "male",   "Male"
        FEMALE = "female", "Female"
        OTHER  = "other",  "Other"

    class BloodGroup(models.TextChoices):
        A_POS  = "A+",  "A+"
        A_NEG  = "A-",  "A-"
        B_POS  = "B+",  "B+"
        B_NEG  = "B-",  "B-"
        AB_POS = "AB+", "AB+"
        AB_NEG = "AB-", "AB-"
        O_POS  = "O+",  "O+"
        O_NEG  = "O-",  "O-"

    class Category(models.TextChoices):
        GENERAL = "general", "General"
        OBC     = "obc",     "OBC"
        SC      = "sc",      "SC"
        ST      = "st",      "ST"
        EWS     = "ews",     "EWS"

    # Core identity
    full_name        = models.CharField(max_length=255)
    admission_number = models.CharField(max_length=64, blank=True, db_index=True)
    date_of_birth    = models.DateField(null=True, blank=True)
    gender           = models.CharField(max_length=8, choices=Gender.choices, blank=True)
    blood_group      = models.CharField(max_length=4, choices=BloodGroup.choices, blank=True)
    category         = models.CharField(max_length=16, choices=Category.choices, default=Category.GENERAL)
    religion         = models.CharField(max_length=64, blank=True)
    nationality      = models.CharField(max_length=64, default="Indian")
    photo_key        = models.CharField(max_length=512, blank=True)  # S3/R2 object key

    # Academic placement
    classroom    = models.ForeignKey(Classroom, null=True, blank=True, on_delete=models.SET_NULL)
    roll_number  = models.CharField(max_length=32, blank=True)
    house        = models.ForeignKey("House", null=True, blank=True, on_delete=models.SET_NULL, related_name="students")
    admission_date = models.DateField(null=True, blank=True)
    is_active    = models.BooleanField(default=True)

    # Contact / address
    address               = models.TextField(blank=True)
    emergency_contact_name  = models.CharField(max_length=255, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)

    # Parent relationship
    parents = models.ManyToManyField(
        "accounts.ParentProfile",
        through="StudentParentLink",
        related_name="students",
        blank=True,
    )

    # Temporary fields populated during bulk import.
    # Once the parent registers with this phone number, these are cleared
    # and a real StudentParentLink is created instead.
    pending_parent_phone = models.CharField(max_length=20, blank=True, default="")
    pending_parent_name  = models.CharField(max_length=255, blank=True, default="")

    def save(self, *args, **kwargs):
        if not self.admission_number and self.school_id:
            self.admission_number = _next_admission_number(self.school)
        super().save(*args, **kwargs)


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


# ── Student Management: Documents ─────────────────────────────────────────────

class StudentDocument(SchoolScopedModel):
    class DocType(models.TextChoices):
        BIRTH_CERTIFICATE = "birth_certificate", "Birth Certificate"
        AADHAR            = "aadhar",            "Aadhaar Card"
        TRANSFER_CERT     = "transfer_cert",     "Transfer Certificate"
        REPORT_CARD       = "report_card",       "Report Card"
        PHOTO_ID          = "photo_id",          "Photo ID"
        MEDICAL           = "medical",           "Medical Record"
        OTHER             = "other",             "Other"

    student       = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="documents")
    document_type = models.CharField(max_length=32, choices=DocType.choices, default=DocType.OTHER)
    file_name     = models.CharField(max_length=255)
    file_key      = models.CharField(max_length=512)   # S3/R2 object key
    uploaded_by   = models.ForeignKey("accounts.PlatformUser", null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ["-created_at"]


# ── Student Management: Promotion ──────────────────────────────────────────────

class StudentPromotion(SchoolScopedModel):
    """Records a batch promotion of students from one classroom to another."""
    from_classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name="promotions_from")
    to_classroom   = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name="promotions_to")
    academic_year  = models.ForeignKey("AcademicYear", null=True, blank=True, on_delete=models.SET_NULL)
    promoted_by    = models.ForeignKey("accounts.PlatformUser", null=True, blank=True, on_delete=models.SET_NULL)
    student_count  = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]


# ── Student Management: Transfer Certificate ───────────────────────────────────

def _next_tc_number(school):
    from django.utils import timezone
    year = timezone.now().year
    prefix = f"TC/{school.slug.upper()[:6]}/{year}/"
    last = (
        TransferCertificate.objects
        .filter(school=school, tc_number__startswith=prefix)
        .order_by("-tc_number")
        .values_list("tc_number", flat=True)
        .first()
    )
    seq = 1
    if last:
        try:
            seq = int(last.split("/")[-1]) + 1
        except (ValueError, IndexError):
            pass
    return f"{prefix}{seq:04d}"


class TransferCertificate(SchoolScopedModel):
    class Reason(models.TextChoices):
        NEW_SCHOOL  = "new_school",  "Admission to Another School"
        RELOCATION  = "relocation",  "Family Relocation"
        COMPLETION  = "completion",  "Course Completion"
        OTHER       = "other",       "Other"

    student    = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="transfer_certificates")
    tc_number  = models.CharField(max_length=64, unique=True, blank=True)
    issued_date = models.DateField()
    reason     = models.CharField(max_length=32, choices=Reason.choices, default=Reason.NEW_SCHOOL)
    remark     = models.TextField(blank=True)
    issued_by  = models.ForeignKey("accounts.PlatformUser", null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ["-issued_date"]

    def save(self, *args, **kwargs):
        if not self.tc_number and self.school_id:
            self.tc_number = _next_tc_number(self.school)
        super().save(*args, **kwargs)


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


# ── Module C: Timetable ────────────────────────────────────────────────────────

class Timetable(SchoolScopedModel):
    """A weekly timetable for a classroom in an academic year."""
    classroom    = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name="timetables")
    academic_year = models.ForeignKey(AcademicYear, null=True, blank=True, on_delete=models.SET_NULL)
    label        = models.CharField(max_length=64, default="Regular")  # "Regular", "Exam Week", etc.
    is_active    = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]


class TimetableSlot(SchoolScopedModel):
    class SlotType(models.TextChoices):
        REGULAR  = "regular",  "Regular"
        BREAK    = "break",    "Break"
        ASSEMBLY = "assembly", "Assembly"
        FREE     = "free",     "Free"

    timetable     = models.ForeignKey(Timetable, on_delete=models.CASCADE, related_name="slots")
    subject       = models.ForeignKey(Subject, null=True, blank=True, on_delete=models.SET_NULL)
    teacher       = models.ForeignKey("accounts.TeacherProfile", null=True, blank=True, on_delete=models.SET_NULL)
    weekday       = models.PositiveSmallIntegerField()  # 1=Mon … 6=Sat
    period_number = models.PositiveSmallIntegerField()  # 1, 2, 3 …
    starts_at     = models.TimeField()
    ends_at       = models.TimeField()
    slot_type     = models.CharField(max_length=16, choices=SlotType.choices, default=SlotType.REGULAR)

    class Meta:
        unique_together = [("timetable", "weekday", "period_number")]
        ordering = ["weekday", "period_number"]


# ── Module C: Homework ─────────────────────────────────────────────────────────

class Homework(SchoolScopedModel):
    classroom     = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name="homework")
    subject       = models.ForeignKey(Subject, null=True, blank=True, on_delete=models.SET_NULL)
    teacher       = models.ForeignKey("accounts.TeacherProfile", null=True, blank=True, on_delete=models.SET_NULL)
    title         = models.CharField(max_length=255)
    description   = models.TextField(blank=True)
    assigned_date = models.DateField()
    due_date      = models.DateField()
    is_active     = models.BooleanField(default=True)

    class Meta:
        ordering = ["-due_date"]


# ── Module C: Exams ────────────────────────────────────────────────────────────

class Exam(SchoolScopedModel):
    class ExamType(models.TextChoices):
        UNIT_TEST  = "unit_test",  "Unit Test"
        MIDTERM    = "midterm",    "Midterm"
        FINAL      = "final",      "Final"
        PRACTICAL  = "practical",  "Practical"
        OTHER      = "other",      "Other"

    academic_year = models.ForeignKey(AcademicYear, null=True, blank=True, on_delete=models.SET_NULL, related_name="exams")
    name          = models.CharField(max_length=128)   # "Unit Test 1", "Midterm"
    exam_type     = models.CharField(max_length=16, choices=ExamType.choices, default=ExamType.OTHER)
    start_date    = models.DateField()
    end_date      = models.DateField()
    is_published  = models.BooleanField(default=False)  # results visible to parents

    class Meta:
        ordering = ["-start_date"]


class ExamSchedule(SchoolScopedModel):
    """Subject-wise schedule and marks config within an exam, per classroom."""
    exam          = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="schedules")
    classroom     = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name="exam_schedules")
    subject       = models.ForeignKey(Subject, on_delete=models.CASCADE)
    date          = models.DateField()
    starts_at     = models.TimeField(null=True, blank=True)
    ends_at       = models.TimeField(null=True, blank=True)
    max_marks     = models.PositiveSmallIntegerField(default=100)
    passing_marks = models.PositiveSmallIntegerField(default=35)

    class Meta:
        unique_together = [("exam", "classroom", "subject")]
        ordering = ["date"]


def _compute_grade(percentage: float) -> str:
    if percentage >= 90: return "A+"
    if percentage >= 80: return "A"
    if percentage >= 70: return "B+"
    if percentage >= 60: return "B"
    if percentage >= 50: return "C+"
    if percentage >= 40: return "C"
    if percentage >= 35: return "D"
    return "F"


class ExamResult(SchoolScopedModel):
    """Marks obtained by a student in one exam subject (ExamSchedule)."""
    exam_schedule   = models.ForeignKey(ExamSchedule, on_delete=models.CASCADE, related_name="results")
    student         = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="exam_results")
    marks_obtained  = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    is_absent       = models.BooleanField(default=False)
    grade           = models.CharField(max_length=4, blank=True)
    entered_by      = models.ForeignKey("accounts.TeacherProfile", null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        unique_together = [("exam_schedule", "student")]

    def save(self, *args, **kwargs):
        if self.marks_obtained is not None and not self.is_absent:
            pct = float(self.marks_obtained) / float(self.exam_schedule.max_marks) * 100
            self.grade = _compute_grade(pct)
        elif self.is_absent:
            self.grade = "AB"
        super().save(*args, **kwargs)


# ── Module C: Report Cards ─────────────────────────────────────────────────────

class ReportCard(SchoolScopedModel):
    """Aggregated result card for a student across all subjects in an exam."""
    student         = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="report_cards")
    exam            = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="report_cards")
    academic_year   = models.ForeignKey(AcademicYear, null=True, blank=True, on_delete=models.SET_NULL)
    total_marks     = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    obtained_marks  = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    percentage      = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    grade           = models.CharField(max_length=4, blank=True)
    rank            = models.PositiveIntegerField(null=True, blank=True)
    remarks         = models.TextField(blank=True)
    is_published    = models.BooleanField(default=False)
    generated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("student", "exam")]
        ordering = ["-exam__start_date"]


# ── UDISE Report ───────────────────────────────────────────────────────────────

class UDISEReport(SchoolScopedModel):
    """Annual UDISE+ data report per school per academic year.

    Student enrollment, teacher counts, and academic performance are computed
    on-the-fly from existing data.  Physical infrastructure data is stored here
    as a JSON blob since it has no other home in the system.
    """

    class Status(models.TextChoices):
        DRAFT     = "draft",     "Draft"
        SUBMITTED = "submitted", "Submitted"

    academic_year = models.ForeignKey(
        AcademicYear, null=True, blank=True, on_delete=models.SET_NULL, related_name="udise_reports",
    )
    udise_code    = models.CharField(max_length=12, blank=True)
    status        = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)

    # ── Infrastructure (manually entered by admin) ─────────────────────────
    # Stored as a JSON blob; keys are stable snake_case field names.
    # Default keys and their expected types are documented in UDISE_INFRA_SCHEMA.
    infrastructure = models.JSONField(default=dict, blank=True)

    submitted_at = models.DateTimeField(null=True, blank=True)
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
    )

    class Meta:
        unique_together = [("school", "academic_year")]
        ordering = ["-academic_year__start_date"]
