"""
When a ParentProfile is created (parent registers for the first time),
check if any students in the same school have a matching pending_parent_phone.
If so, create the StudentParentLink and clear the temporary fields.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender="accounts.ParentProfile")
def link_pending_students(sender, instance, created, **kwargs):
    if not created:
        return

    phone = instance.phone
    if not phone:
        return

    from apps.academics.models import Student, StudentParentLink

    pending = Student.objects.filter(
        school=instance.school,
        pending_parent_phone=phone,
    )

    for student in pending:
        StudentParentLink.objects.get_or_create(
            school=instance.school,
            student=student,
            parent=instance,
            defaults={"is_primary": True, "source": StudentParentLink.Source.DIRECT},
        )
        student.pending_parent_phone = ""
        student.pending_parent_name  = ""
        student.save(update_fields=["pending_parent_phone", "pending_parent_name"])
