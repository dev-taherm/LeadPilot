import json
import logging
import threading

import requests

from .base import ChannelAdapter

logger = logging.getLogger(__name__)

DISCORD_API = 'https://discord.com/api/v10'
DISCORD_GATEWAY = 'wss://gateway.discord.gg'


class DiscordAdapter(ChannelAdapter):
    """Discord Bot API adapter."""

    def _get_headers(self):
        token = self.config.get('bot_token', '')
        return {
            'Authorization': f'Bot {token}',
            'Content-Type': 'application/json',
        }

    def send_message(self, to: str, content: str, **kwargs) -> dict:
        token = self.config.get('bot_token', '')
        if not token:
            return {'success': False, 'error': 'Missing bot_token'}

        try:
            resp = requests.post(
                f'{DISCORD_API}/channels/{to}/messages',
                headers=self._get_headers(),
                json={'content': content},
                timeout=10,
            )
            data = resp.json()
            if resp.status_code in (200, 201):
                return {'success': True, 'message_id': data.get('id')}
            return {'success': False, 'error': data.get('message', 'Unknown error')}
        except Exception as e:
            logger.exception("Discord send failed")
            return {'success': False, 'error': str(e)}

    def verify_webhook(self, request) -> bool:
        return True

    def parse_incoming(self, request) -> dict | None:
        try:
            data = json.loads(request.body)
        except Exception:
            return None

        if data.get('t') != 'MESSAGE_CREATE':
            return None

        d = data.get('d', {})
        author = d.get('author', {})
        if author.get('bot'):
            return None

        content = d.get('content', '')
        if not content:
            return None

        return {
            'sender_id': author.get('id', ''),
            'sender_name': author.get('username', ''),
            'content': content,
            'metadata': {
                'message_id': d.get('id'),
                'channel_id': d.get('channel_id'),
                'guild_id': d.get('guild_id'),
            },
        }

    def health_check(self) -> dict:
        token = self.config.get('bot_token', '')
        if not token:
            return {'status': 'error', 'message': 'Missing bot_token'}
        try:
            resp = requests.get(
                f'{DISCORD_API}/users/@me',
                headers=self._get_headers(),
                timeout=10,
            )
            data = resp.json()
            if resp.status_code == 200:
                return {'status': 'ok', 'message': f"Bot: {data.get('username', '')}"}
            return {'status': 'error', 'message': data.get('message', 'Auth failed')}
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
