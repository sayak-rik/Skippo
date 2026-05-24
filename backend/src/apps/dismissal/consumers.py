from channels.generic.websocket import AsyncJsonWebsocketConsumer


class DismissalConsumer(AsyncJsonWebsocketConsumer):
    """WebSocket channel: dismissal:{school_id}

    Dashboard clients connect here to receive real-time queue updates.
    The server broadcasts whenever an intent is created, notified, or completed.
    """

    async def connect(self):
        self.school_id = self.scope["url_route"]["kwargs"]["school_id"]
        self.group_name = f"dismissal_{self.school_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        # Send the current queue snapshot on connect so the dashboard is
        # immediately populated without waiting for the next mutation.
        from asgiref.sync import sync_to_async
        payload = await sync_to_async(self._get_queue)()
        await self.send_json(payload)

    def _get_queue(self):
        from apps.dismissal.models import DismissalIntent
        intents = DismissalIntent.objects.filter(
            school_id=self.school_id, status__in=["pending", "notified"]
        ).select_related("student").order_by("created_at")
        return {
            "queue": [
                {
                    "id": i.id,
                    "studentId": i.student.id,
                    "studentName": i.student.full_name,
                    "etaMinutes": i.eta_minutes,
                    "status": i.status,
                }
                for i in intents
            ],
            "count": intents.count(),
        }

    async def receive_json(self, content, **kwargs):
        # Clients don't send messages — this channel is server → client only.
        pass

    async def dismissal_update(self, event):
        """Handler for group_send messages of type 'dismissal.update'."""
        await self.send_json(event["payload"])

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
