from channels.generic.websocket import AsyncJsonWebsocketConsumer

from common.demo_state import get_dismissal_queue


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
        await self.send_json(get_dismissal_queue())

    async def receive_json(self, content, **kwargs):
        # Clients don't send messages — this channel is server → client only.
        pass

    async def dismissal_update(self, event):
        """Handler for group_send messages of type 'dismissal.update'."""
        await self.send_json(event["payload"])

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
