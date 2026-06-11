from .whatsapp import WhatsAppAdapter
from .telegram import TelegramAdapter
from .twilio import TwilioAdapter
from .email_adapter import EmailAdapter
from .slack import SlackAdapter
from .discord import DiscordAdapter
from .instagram import InstagramAdapter
from .facebook import FacebookAdapter

ADAPTER_MAP = {
    'whatsapp': WhatsAppAdapter,
    'telegram': TelegramAdapter,
    'sms': TwilioAdapter,
    'email': EmailAdapter,
    'slack': SlackAdapter,
    'discord': DiscordAdapter,
    'instagram': InstagramAdapter,
    'facebook': FacebookAdapter,
}


def get_adapter(integration):
    adapter_class = ADAPTER_MAP.get(integration.channel_type)
    if not adapter_class:
        raise ValueError(f"Unknown channel type: {integration.channel_type}")
    return adapter_class(integration)
