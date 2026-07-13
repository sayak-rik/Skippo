from django.db import models
from django.utils import timezone


class AITeacherPodRegistry(models.Model):
    """Persistent record of every Fly.io machine created for AI teacher class pods.

    One pod per class session. Redis holds hot runtime state (heartbeats).
    This table is the audit trail and recovery surface.
    """

    class MachineState(models.TextChoices):
        STARTING   = "starting",   "Starting"
        STARTED    = "started",    "Started"
        STOPPING   = "stopping",   "Stopping"
        STOPPED    = "stopped",    "Stopped"
        DESTROYED  = "destroyed",  "Destroyed"
        UNKNOWN    = "unknown",    "Unknown"

    class PodStatus(models.TextChoices):
        ACTIVE    = "active",    "Active"
        ENDED     = "ended",     "Ended"
        DESTROYED = "destroyed", "Destroyed"

    machine_id         = models.CharField(max_length=255, unique=True, db_index=True)
    class_id           = models.CharField(max_length=255, db_index=True)
    pod_url            = models.TextField(blank=True)
    machine_state      = models.CharField(
        max_length=32, choices=MachineState.choices, default=MachineState.UNKNOWN, db_index=True
    )
    pod_status         = models.CharField(
        max_length=32, choices=PodStatus.choices, default=PodStatus.ACTIVE, db_index=True
    )
    region             = models.CharField(max_length=16, blank=True)
    metadata           = models.JSONField(default=dict, blank=True)
    machine_created_at = models.DateTimeField(null=True, blank=True)
    ended_at           = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at         = models.DateTimeField(auto_now_add=True)
    updated_at         = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ai_teacher_pod_registry"
        ordering = ["-created_at"]
        indexes  = [
            models.Index(fields=["class_id", "pod_status"]),
            models.Index(fields=["machine_state", "ended_at"]),
        ]

    def __str__(self):
        return f"Pod {self.machine_id} | class={self.class_id} | {self.machine_state}"

    @property
    def is_active(self) -> bool:
        return (
            self.ended_at is None
            and self.machine_state not in (self.MachineState.STOPPED, self.MachineState.DESTROYED)
        )

    def mark_ended(self) -> None:
        self.ended_at = timezone.now()
        self.pod_status = self.PodStatus.ENDED
        self.save(update_fields=["ended_at", "pod_status", "updated_at"])
