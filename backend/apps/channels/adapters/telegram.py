import logging

import requests

from .base import ChannelAdapter

logger = logging.getLogger(__name__)

TELEGRAM_API = 'https://api.telegram.org'


class TelegramAdapter(ChannelAdapter):
    """Telegram Bot API adapter."""

    def _get_token(self):
        return self.config.get('bot_token', '')

    def _api_url(self, method):
        return f'{TELEGRAM_API}/bot{self._get_token()}/{method}'

    def send_message(self, to: str, content: str, **kwargs) -> dict:
        token = self._get_token()
        if not token:
            return {'success': False, 'error': 'Missing bot_token'}

        try:
            resp = requests.post(
                self._api_url('sendMessage'),
                json={
                    'chat_id': to,
                    'text': content,
                    'parse_mode': 'HTML',
                },
                timeout=10,
            )
            data = resp.json()
            if data.get('ok'):
                result = data.get('result', {})
                return {'success': True, 'message_id': result.get('message_id')}
            return {'success': False, 'error': data.get('description', 'Unknown error')}
        except Exception as e:
            logger.exception("Telegram send failed")
            return {'success': False, 'error': str(e)}

    def verify_webhook(self, request) -> bool:
        return True

    def parse_incoming(self, request) -> dict | None:
        try:
            data = request.json() if hasattr(request, 'json') else {}
        except Exception:
            import json
            data = json.loads(request.body)

        message = data.get('message') or data.get('channel_post')
        if not message:
            return None

        text = message.get('text', '')
        if not text or text.startswith('/'):
            return None

        sender = message.get('from', {})
        chat = message.get('chat', {})
        return {
            'sender_id': str(sender.get('id', chat.get('id', ''))),
            'sender_name': f"{sender.get('first_name', '')} {sender.get('last_name', '')}".strip(),
            'content': text,
            'metadata': {
                'message_id': message.get('message_id'),
                'chat_id': chat.get('id'),
                'chat_type': chat.get('type'),
            },
        }

    def get_sender_info(self, sender_id: str) -> dict:
        token = self._get_token()
        if not token:
            return {'id': sender_id, 'name': sender_id}
        try:
            resp = requests.get(
                self._api_url('getChat'),
                params={'chat_id': sender_id},
                timeout=10,
            )
            data = resp.json()
            if data.get('ok'):
                chat = data.get('result', {})
                name = chat.get('first_name', '') or chat.get('title', sender_id)
                return {'id': sender_id, 'name': name}
        except Exception:
            pass
        return {'id': sender_id, 'name': sender_id}

    def set_webhook(self, webhook_url: str) -> dict:
        token = self._get_token()
        if not token:
            return {'success': False, 'error': 'Missing bot_token'}
        try:
            resp = requests.post(
                self._api_url('setWebhook'),
                json={'url': webhook_url, 'allowed_updates': ['message']},
                timeout=10,
            )
            data = resp.json()
            return {'success': data.get('ok', False), 'message': data.get('description', '')}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def health_check(self) -> dict:
        token = self._get_token()
        if not token:
            return {'status': 'error', 'message': 'Missing bot_token'}
        try:
            resp = requests.get(self._api_url('getMe'), timeout=10)
            data = resp.json()
            if data.get('ok'):
                bot = data.get('result', {})
                return {'status': 'ok', 'message': f"Bot: @{bot.get('username', 'unknown')}"}
            return {'status': 'error', 'message': data.get('description', 'API error')}
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
