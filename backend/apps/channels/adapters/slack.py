import hashlib
import hmac
import logging
import time

import requests

from .base import ChannelAdapter

logger = logging.getLogger(__name__)

SLACK_API = 'https://slack.com/api'


class SlackAdapter(ChannelAdapter):
    """Slack Web API adapter."""

    def send_message(self, to: str, content: str, **kwargs) -> dict:
        token = self.config.get('bot_token', '')
        if not token:
            return {'success': False, 'error': 'Missing bot_token'}

        try:
            resp = requests.post(
                f'{SLACK_API}/chat.postMessage',
                headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json',
                },
                json={
                    'channel': to,
                    'text': content,
                },
                timeout=10,
            )
            data = resp.json()
            if data.get('ok'):
                return {'success': True, 'message_id': data.get('ts')}
            return {'success': False, 'error': data.get('error', 'Unknown error')}
        except Exception as e:
            logger.exception("Slack send failed")
            return {'success': False, 'error': str(e)}

    def verify_webhook(self, request) -> bool:
        signing_secret = self.config.get('signing_secret', '')
        if not signing_secret:
            return True

        timestamp = request.META.get('HTTP_X_SLACK_REQUEST_TIMESTAMP', '')
        signature = request.META.get('HTTP_X_SLACK_SIGNATURE', '')

        if not timestamp or not signature:
            return False

        if abs(time.time() - float(timestamp)) > 300:
            return False

        basestring = f'v0:{timestamp}:{request.body.decode()}'
        expected = 'v0=' + hmac.new(
            signing_secret.encode(),
            basestring.encode(),
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(signature, expected)

    def parse_incoming(self, request) -> dict | None:
        try:
            import json
            data = json.loads(request.body)
        except Exception:
            return None

        if data.get('type') == 'url_verification':
            return None

        event = data.get('event', {})
        if event.get('type') != 'message':
            return None
        if event.get('subtype'):
            return None

        user_id = event.get('user', '')
        text = event.get('text', '')
        channel = event.get('channel', '')

        if not user_id or not text:
            return None

        token = self.config.get('bot_token', '')
        sender_name = user_id
        if token:
            try:
                resp = requests.get(
                    f'{SLACK_API}/users.info',
                    headers={'Authorization': f'Bearer {token}'},
                    params={'user': user_id},
                    timeout=5,
                )
                user_data = resp.json()
                if user_data.get('ok'):
                    profile = user_data.get('user', {}).get('profile', {})
                    sender_name = profile.get('real_name', user_id)
            except Exception:
                pass

        return {
            'sender_id': user_id,
            'sender_name': sender_name,
            'content': text,
            'metadata': {
                'slack_channel': channel,
                'ts': event.get('ts'),
                'thread_ts': event.get('thread_ts'),
            },
        }

    def health_check(self) -> dict:
        token = self.config.get('bot_token', '')
        if not token:
            return {'status': 'error', 'message': 'Missing bot_token'}
        try:
            resp = requests.get(
                f'{SLACK_API}/auth.test',
                headers={'Authorization': f'Bearer {token}'},
                timeout=10,
            )
            data = resp.json()
            if data.get('ok'):
                return {'status': 'ok', 'message': f"Bot: {data.get('user', '')} in {data.get('team', '')}"}
            return {'status': 'error', 'message': data.get('error', 'Auth failed')}
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
