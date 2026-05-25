import logging

import httpx

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def send_push(tokens: list[str], title: str, body: str, data: dict | None = None) -> None:
    """Fire-and-forget push to a list of Expo push tokens via Expo's push gateway."""
    if not tokens:
        return

    messages = [
        {"to": t, "title": title, "body": body, "data": data or {}, "sound": "default"}
        for t in tokens
    ]
    try:
        with httpx.Client(timeout=10) as client:
            resp = client.post(
                EXPO_PUSH_URL,
                json=messages,
                headers={"Content-Type": "application/json", "Accept": "application/json"},
            )
            resp.raise_for_status()
    except Exception as exc:
        logger.warning("Expo push failed: %s", exc)


def notify_parents_of_students(
    student_ids: list[int],
    title: str,
    body: str,
    data: dict | None = None,
) -> None:
    """Look up Expo push tokens for all parents linked to the given students and notify them."""
    from apps.academics.models import StudentParentLink
    from apps.notifications.models import DeviceToken

    parent_ids = list(
        StudentParentLink.objects.filter(student_id__in=student_ids)
        .values_list("parent_id", flat=True)
        .distinct()
    )
    if not parent_ids:
        return

    tokens = list(
        DeviceToken.objects.filter(parent_id__in=parent_ids).values_list("token", flat=True)
    )
    send_push(tokens, title, body, data)


def notify_classroom_parents(
    classroom_id: int,
    title: str,
    body: str,
    data: dict | None = None,
) -> None:
    """Notify all parents of students currently enrolled in a classroom."""
    from apps.academics.models import Student

    student_ids = list(
        Student.objects.filter(classroom_id=classroom_id, is_active=True).values_list(
            "id", flat=True
        )
    )
    notify_parents_of_students(student_ids, title, body, data)
