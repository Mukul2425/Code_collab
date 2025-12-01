import json
from channels.generic.websocket import AsyncWebsocketConsumer


class FileConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.file_id = self.scope['url_route']['kwargs']['file_id']
        self.room_group_name = f'file_{self.file_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'file_update':
            content = data.get('content')
            # Broadcast file content changes to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'file_message',
                    'content': content,
                    'sender_channel_name': self.channel_name
                }
            )

        elif message_type == 'cursor_update':
            # Broadcast cursor position for presence-style cursor tracking
            username = data.get('username') or 'Guest'
            position = data.get('position')
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'cursor_message',
                    'username': username,
                    'position': position,
                    'sender_channel_name': self.channel_name,
                }
            )

        elif message_type == 'presence_join':
            username = data.get('username') or 'Guest'
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'presence_message',
                    'action': 'join',
                    'username': username,
                    'sender_channel_name': self.channel_name,
                }
            )

        elif message_type == 'presence_leave':
            username = data.get('username') or 'Guest'
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'presence_message',
                    'action': 'leave',
                    'username': username,
                    'sender_channel_name': self.channel_name,
                }
            )

    # Receive file update from room group
    async def file_message(self, event):
        content = event['content']
        sender_channel_name = event['sender_channel_name']

        # Do not send back to the sender
        if self.channel_name != sender_channel_name:
            await self.send(text_data=json.dumps({
                'type': 'file_update',
                'content': content
            }))

    # Receive cursor update from room group
    async def cursor_message(self, event):
        sender_channel_name = event['sender_channel_name']

        # Do not send back to the sender
        if self.channel_name != sender_channel_name:
            await self.send(text_data=json.dumps({
                'type': 'cursor_update',
                'username': event['username'],
                'position': event['position'],
            }))

    # Receive presence event from room group
    async def presence_message(self, event):
        sender_channel_name = event['sender_channel_name']

        # Do not send back to the sender
        if self.channel_name != sender_channel_name:
            await self.send(text_data=json.dumps({
                'type': 'presence',
                'action': event['action'],
                'username': event['username'],
            }))
