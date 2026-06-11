import hashlib
import hmac
import logging

import requests

from .base import ChannelAdapter

logger = logging.getLogger(__name__)

GRAPH_API_VERSION = 'v21.0'
GRAPH_API_BASE = f'https://graph.facebook.com/{GRAPH_API_VERSION}'


class WhatsAppAdapter(ChannelAdapter):
    """WhatsApp Business Cloud API adapter."""

    def send_message(self, to: str, content: str, **kwargs) -> dict:
        phone_number_id = self.config.get('phone_number_id', '')
        access_token = self.config.get('access_token', '')
        if not phone_number_id or not access_token:
            return {'success': False, 'error': 'Missing phone_number_id or access_token'}

        url = f'{GRAPH_API_BASE}/{phone_number_id}/messages'
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        payload = {
            'messaging_product': 'whatsapp',
            'to': to,
            'type': 'text',
            'text': {'body': content},
        }
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=30)
            data = resp.json()
            if resp.status_code == 200:
                messages = data.get('messages', [])
                return {'success': True, 'message_id': messages[0]['id'] if messages else None}
            return {'success': False, 'error': data.get('error', {}).get('message', 'Unknown error')}
        except Exception as e:
            logger.exception("WhatsApp send failed")
            return {'success': False, 'error': str(e)}

    def verify_webhook(self, request) -> bool:
        if request.method == 'GET':
            mode = request.GET.get('hub.mode')
            token = request.GET.get('hub.verify_token')
            challenge = request.GET.get('hub.challenge')
            expected_token = self.config.get('verify_token', '')
            if mode == 'subscribe' and token == expected_token:
                from django.http import HttpResponse
                return True
            return False
        verify_token = self.config.get('verify_token', '')
        x_hub_signature = request.META.get('HTTP_X_HUB_SIGNATURE_256', '')
        if not x_hub_signature:
            return self.config.get('app_secret', '') == ''
        expected = 'sha256=' + hmac.new(
            self.config.get('app_secret', '').encode(),
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
            for change in entry.get('changes', []):
                value = change.get('value', {})
                messages = value.get('messages', [])
                for msg in messages:
                    return {
                        'sender_id': msg.get('from', ''),
                        'sender_name': value.get('contacts', [{}])[0].get('profile', {}).get('name', ''),
                        'content': msg.get('text', {}).get('body', ''),
                        'metadata': {
                            'message_id': msg.get('id'),
                            'timestamp': msg.get('timestamp'),
                            'type': msg.get('type'),
                        },
                    }
        return None

    def get_sender_info(self, sender_id: str) -> dict:
        phone_number_id = self.config.get('phone_number_id', '')
        access_token = self.config.get('access_token', '')
        url = f'{GRAPH_API_BASE}/{phone_number_id}/contacts'
        headers = {'Authorization': f'Bearer {access_token}'}
        try:
            resp = requests.get(url, headers=headers, params={'phone': sender_id}, timeout=10)
            data = resp.json()
            contacts = data.get('data', [])
            if contacts:
                return {'id': sender_id, 'name': contacts[0].get('wa_id', sender_id)}
        except Exception:
            pass
        return {'id': sender_id, 'name': sender_id}

    def health_check(self) -> dict:
        phone_number_id = self.config.get('phone_number_id', '')
        access_token = self.config.get('access_token', '')
        if not phone_number_id or not access_token:
            return {'status': 'error', 'message': 'Missing credentials'}
        url = f'{GRAPH_API_BASE}/{phone_number_id}'
        headers = {'Authorization': f'Bearer {access_token}'}
        try:
            resp = requests.get(url, headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                return {'status': 'ok', 'message': f"Connected: {data.get('display_phone_number', '')}"}
            return {'status': 'error', 'message': resp.json().get('error', {}).get('message', 'API error')}
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
