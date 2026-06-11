import hashlib
import hmac
import logging
import urllib.parse

import requests

from .base import ChannelAdapter

logger = logging.getLogger(__name__)

TWILIO_API = 'https://api.twilio.com/2010-04-01'


class TwilioAdapter(ChannelAdapter):
    """Twilio SMS adapter."""

    def _get_auth(self):
        return self.config.get('account_sid', ''), self.config.get('auth_token', '')

    def send_message(self, to: str, content: str, **kwargs) -> dict:
        account_sid, auth_token = self._get_auth()
        phone_number = self.config.get('phone_number', '')
        if not account_sid or not auth_token or not phone_number:
            return {'success': False, 'error': 'Missing Twilio credentials or phone_number'}

        url = f'{TWILIO_API}/Accounts/{account_sid}/Messages.json'
        try:
            resp = requests.post(
                url,
                data={
                    'From': phone_number,
                    'To': to,
                    'Body': content,
                },
                auth=(account_sid, auth_token),
                timeout=30,
            )
            data = resp.json()
            if resp.status_code in (200, 201):
                return {'success': True, 'message_sid': data.get('sid')}
            return {'success': False, 'error': data.get('message', 'Unknown error')}
        except Exception as e:
            logger.exception("Twilio SMS send failed")
            return {'success': False, 'error': str(e)}

    def verify_webhook(self, request) -> bool:
        account_sid, auth_token = self._get_auth()
        if not auth_token:
            return True

        twilio_signature = request.META.get('HTTP_X_TWILIO_SIGNATURE', '')
        if not twilio_signature:
            return False

        url = request.build_absolute_uri()
        params = request.POST.dict() if request.method == 'POST' else {}

        sorted_params = urllib.parse.urlencode(sorted(params.items()))
        data = url + sorted_params
        expected = hmac.new(
            auth_token.encode(),
            data.encode(),
            hashlib.sha1,
        ).digest()
        import base64
        expected_b64 = base64.b64encode(expected).decode()
        return hmac.compare_digest(twilio_signature, expected_b64)

    def parse_incoming(self, request) -> dict | None:
        body = request.POST if request.method == 'POST' else request.GET
        from_number = body.get('From', '')
        message_body = body.get('Body', '')
        if not from_number or not message_body:
            return None
        return {
            'sender_id': from_number,
            'sender_name': from_number,
            'content': message_body,
            'metadata': {
                'message_sid': body.get('MessageSid', ''),
                'account_sid': body.get('AccountSid', ''),
                'num_media': body.get('NumMedia', '0'),
            },
        }

    def health_check(self) -> dict:
        account_sid, auth_token = self._get_auth()
        if not account_sid or not auth_token:
            return {'status': 'error', 'message': 'Missing credentials'}
        try:
            resp = requests.get(
                f'{TWILIO_API}/Accounts/{account_sid}.json',
                auth=(account_sid, auth_token),
                timeout=10,
            )
            if resp.status_code == 200:
                data = resp.json()
                return {'status': 'ok', 'message': f"Account: {data.get('friendly_name', account_sid)}"}
            return {'status': 'error', 'message': 'Invalid credentials'}
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
