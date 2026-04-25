from datetime import date, timedelta

from celery import shared_task

from common.sms import send_sms
from .models import FeeInvoice


@shared_task
def send_fee_reminders():
    """
    Runs daily.  For each pending invoice due in 1, 2, or 3 days, sends an
    SMS reminder to every linked parent of that student.
    """
    today = date.today()

    for days_ahead in [3, 2, 1]:
        target = today + timedelta(days=days_ahead)
        invoices = (
            FeeInvoice.objects
            .filter(due_date=target, status=FeeInvoice.Status.PENDING)
            .select_related("student", "school")
        )
        for invoice in invoices:
            from apps.academics.models import StudentParentLink
            links = (
                StudentParentLink.objects
                .filter(student=invoice.student)
                .select_related("parent")
            )
            for link in links:
                phone = link.parent.phone
                if not phone:
                    continue
                day_label = "tomorrow" if days_ahead == 1 else f"in {days_ahead} days"
                msg = (
                    f"[{invoice.school.name}] Fee reminder: ₹{invoice.amount} "
                    f"({invoice.category_name}) for {invoice.student.full_name} "
                    f"is due {day_label} ({target.strftime('%d %b %Y')}). "
                    "Pay now via the Skippo parent app."
                )
                send_sms(phone, msg)


@shared_task
def mark_overdue_invoices():
    """Runs daily.  Flips pending invoices whose due date has passed to overdue."""
    updated = FeeInvoice.objects.filter(
        status=FeeInvoice.Status.PENDING,
        due_date__lt=date.today(),
    ).update(status=FeeInvoice.Status.OVERDUE)
    return updated
