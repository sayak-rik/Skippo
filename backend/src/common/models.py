from django.db import models


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SchoolScopedModel(TimestampedModel):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)

    class Meta:
        abstract = True
