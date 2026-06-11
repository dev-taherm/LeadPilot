import hashlib
import hmac
import logging

import requests

from .base import ChannelAdapter

logger = logging.getLogger(__name__)

GRAPH_API_VERSION = 'v21.0'
GRAPH_API_BASE = f'https://graph.facebook.com/{GRAPH_API_VERSION}'


class InstagramAdapter(ChannelAdapter):
    """Instagram Messaging (Graph API) adapter."""

    def send_message(self, to: str, content: str, **kwargs) -> dict:
        page_id = self.config.get('page_id', '')
        access_token = self.config.get('page_access_token', '')
        if not page_id or not access_token:
            return {'success': False, 'error': 'Missing page_id or page_access_token'}

        url = f'{GRAPH_API_BASE}/{page_id}/messages'
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        payload = {
            'recipient': {'id': to},
            'message': {'text': content},
        }
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=30)
            data = resp.json()
            if resp.status_code == 200:
                return {'success': True, 'message_id': data.get('message_id')}
            return {'success': False, 'error': data.get('error', {}).get('message', 'Unknown error')}
        except Exception as e:
            logger.exception("Instagram send failed")
            return {'success': False, 'error': str(e)}

    def verify_webhook(self, request) -> bool:
        if request.method == 'GET':
            mode = request.GET.get('hub.mode')
            token = request.GET.get('hub.verify_token')
            verify_token = self.config.get('verify_token', '')
            if mode == 'subscribe' and token == verify_token:
                return True
            return False

        app_secret = self.config.get('app_secret', '')
        if not app_secret:
            return True

        x_hub_signature = request.META.get('HTTP_X_HUB_SIGNATURE_256', '')
        if not x_hub_signature:
            return False

        expected = 'sha256=' + hmac.new(
            app_secret.encode(),
            request.body,
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(x_hub_signature, expected)

    def parse_incoming(self, request) -> dict | None:
        try:
            data = request.json() if hasattr(request, 'json') else {}
        except Exception:
            import json
            data = json.loads(request.body)

        for entry in data.get('entry', []):
            messaging = entry.get('messaging', [])
            for event in messaging:
                message = event.get('message', {})
                text = message.get('text', '')
                sender_id = event.get('sender', {}).get('id', '')
                if text and sender_id:
                    return {
                        'sender_id': sender_id,
                        'sender_name': sender_id,
                        'content': text,
                        'metadata': {
                            'mid': message.get('mid'),
                            'timestamp': event.get('timestamp'),
                        },
                    }
        return None

    def health_check(self) -> dict:
        page_id = self.config.get('page_id', '')
        access_token = self.config.get('page_access_token', '')
        if not page_id or not access_token:
            return {'status': 'error', 'message': 'Missing credentials'}
        try:
            resp = requests.get(
                f'{GRAPH_API_BASE}/{page_id}',
                params={'fields': 'name', 'access_token': access_token},
                timeout=10,
            )
            data = resp.json()
            if 'name' in data:
                return {'status': 'ok', 'message': f"Page: {data['name']}"}
            return {'status': 'error', 'message': data.get('error', {}).get('message', 'API error')}
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
