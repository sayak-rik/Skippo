"""
Celery beat tasks for the reports module.

Weekly digest task fires every Monday at 06:00 IST and generates AI-powered
report cards for all students across all active schools.
"""
import asyncio
import logging
from datetime import date, timedelta

from celery import shared_task

log = logging.getLogger("reports.tasks")


@shared_task(name="reports.generate_weekly_digests")
def generate_weekly_digests():
    """Generate weekly student digests for the week that just ended."""
    from apps.tenancy.models import School
    from apps.reports.services.weekly_digest import generate_for_school

    today = date.today()
    # Monday of the completed week (last Monday)
    last_monday = today - timedelta(days=today.weekday() + 7)

    schools = School.objects.filter(is_active=True)
    log.info("Generating weekly digests for week starting %s across %d schools", last_monday, schools.count())

    for school in schools:
        try:
            asyncio.run(generate_for_school(school, last_monday))
            log.info("Digests done for school %s (week %s)", school.slug, last_monday)
        except Exception as exc:
            log.error("Digest task failed for school %s: %s", school.slug, exc)
