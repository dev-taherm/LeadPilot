import email
import logging
import smtplib
import imaplib
from email.mime.text import MIMEText

from .base import ChannelAdapter

logger = logging.getLogger(__name__)


class EmailAdapter(ChannelAdapter):
    """Email IMAP/SMTP adapter."""

    def send_message(self, to: str, content: str, **kwargs) -> dict:
        smtp_host = self.config.get('smtp_host', '')
        smtp_port = int(self.config.get('smtp_port', 587))
        smtp_user = self.config.get('smtp_user', '')
        smtp_pass = self.config.get('smtp_password', '')
        from_email = self.config.get('from_email', smtp_user)
        subject = kwargs.get('subject', 'Message from LeadFlow AI')

        if not smtp_host or not smtp_user or not smtp_pass:
            return {'success': False, 'error': 'Missing SMTP credentials'}

        msg = MIMEText(content)
        msg['Subject'] = subject
        msg['From'] = from_email
        msg['To'] = to

        try:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
                server.ehlo()
                if smtp_port != 25:
                    server.starttls()
                    server.ehlo()
                server.login(smtp_user, smtp_pass)
                server.sendmail(from_email, [to], msg.as_string())
            return {'success': True, 'to': to, 'subject': subject}
        except Exception as e:
            logger.exception("Email send failed")
            return {'success': False, 'error': str(e)}

    def verify_webhook(self, request) -> bool:
        return True

    def parse_incoming(self, request) -> dict | None:
        return None

    def check_inbox(self) -> list:
        """Poll IMAP inbox for new messages."""
        imap_host = self.config.get('imap_host', '')
        imap_port = int(self.config.get('imap_port', 993))
        imap_user = self.config.get('imap_user', '')
        imap_pass = self.config.get('imap_password', '')

        if not imap_host or not imap_user or not imap_pass:
            return []

        try:
            mail = imaplib.IMAP4_SSL(imap_host, imap_port)
            mail.login(imap_user, imap_pass)
            mail.select('INBOX')

            _, data = mail.search(None, 'UNSEEN')
            message_ids = data[0].split()

            messages = []
            for msg_id in message_ids[-20:]:
                _, msg_data = mail.fetch(msg_id, '(RFC822)')
                raw_email = msg_data[0][1]
                msg = email.message_from_bytes(raw_email)

                from_addr = email.utils.parseaddr(msg['From'])[1]
                subject = msg.get('Subject', '')
                body = ''
                if msg.is_multipart():
                    for part in msg.walk():
                        if part.get_content_type() == 'text/plain':
                            body = part.get_payload(decode=True).decode(errors='ignore')
                            break
                else:
                    body = msg.get_payload(decode=True).decode(errors='ignore')

                messages.append({
                    'sender_id': from_addr,
                    'sender_name': from_addr.split('@')[0],
                    'content': body.strip(),
                    'metadata': {
                        'subject': subject,
                        'message_id': msg.get('Message-ID', ''),
                        'date': msg.get('Date', ''),
                    },
                })

            mail.logout()
            return messages
        except Exception as e:
            logger.exception("IMAP check failed")
            return []

    def health_check(self) -> dict:
        smtp_host = self.config.get('smtp_host', '')
        smtp_user = self.config.get('smtp_user', '')
        if not smtp_host or not smtp_user:
            return {'status': 'error', 'message': 'Missing SMTP credentials'}
        try:
            with smtplib.SMTP(smtp_host, int(self.config.get('smtp_port', 587)), timeout=10) as server:
                server.ehlo()
                return {'status': 'ok', 'message': f"SMTP {smtp_host} reachable"}
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
