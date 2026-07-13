from django.db import models
from django.utils import timezone


class ExamPodRegistry(models.Model):
    """Persistent record of every Fly.io machine ever created for exam-engine pods.

    Redis holds the hot runtime state (session counters, heartbeats).
    This table is the audit trail and recovery surface.
    """

    class MachineState(models.TextChoices):
        STARTING   = "starting",   "Starting"
        STARTED    = "started",    "Started"
        STOPPING   = "stopping",   "Stopping"
        STOPPED    = "stopped",    "Stopped"
        DESTROYED  = "destroyed",  "Destroyed"
        UNKNOWN    = "unknown",    "Unknown"

    class AllocationStatus(models.TextChoices):
        ALLOCATED = "allocated", "Allocated"
        RELEASED  = "released",  "Released"

    machine_id        = models.CharField(max_length=255, unique=True, db_index=True)
    test_id           = models.CharField(max_length=255, db_index=True)
    pod_url           = models.TextField(blank=True)
    machine_state     = models.CharField(
        max_length=32, choices=MachineState.choices, default=MachineState.UNKNOWN, db_index=True
    )
    allocation_status = models.CharField(
        max_length=32, choices=AllocationStatus.choices, default=AllocationStatus.ALLOCATED, db_index=True
    )
    active_sessions   = models.PositiveSmallIntegerField(default=0)
    region            = models.CharField(max_length=16, blank=True)
    metadata          = models.JSONField(default=dict, blank=True)
    machine_created_at = models.DateTimeField(null=True, blank=True)
    deleted_at        = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        db_table  = "exam_pod_registry"
        ordering  = ["-created_at"]
        indexes   = [
            models.Index(fields=["test_id", "allocation_status"]),
            models.Index(fields=["machine_state", "deleted_at"]),
        ]

    def __str__(self):
        return f"Pod {self.machine_id} | test={self.test_id} | {self.machine_state}"

    @property
    def is_active(self) -> bool:
        return (
            self.deleted_at is None
            and self.machine_state not in (self.MachineState.STOPPED, self.MachineState.DESTROYED)
        )

    def soft_delete(self) -> None:
        self.deleted_at = timezone.now()
        self.allocation_status = self.AllocationStatus.RELEASED
        self.save(update_fields=["deleted_at", "allocation_status", "updated_at"])
