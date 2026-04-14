from django.conf import settings
from django.db import models

from common.models import SchoolScopedModel, TimestampedModel


class MessageCampaign(SchoolScopedModel):
    title = models.CharField(max_length=255)
    body = models.TextField()
    audience = models.CharField(max_length=64, default="all")
    category = models.CharField(max_length=64, default="notice")


class MessageReceipt(TimestampedModel):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)
    campaign = models.ForeignKey(MessageCampaign, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    is_read = models.BooleanField(default=False)
