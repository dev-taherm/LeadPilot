import logging
from abc import ABC, abstractmethod
from typing import Any

logger = logging.getLogger(__name__)


class ChannelAdapter(ABC):
    """Base class for all channel adapters."""

    def __init__(self, integration):
        self.integration = integration
        self.config = integration.config or {}

    @abstractmethod
    def send_message(self, to: str, content: str, **kwargs) -> dict:
        """Send a message through this channel.

        Args:
            to: Recipient identifier (phone number, chat ID, email, etc.)
            content: Message content
            **kwargs: Additional platform-specific options

        Returns:
            dict with 'success' bool and platform-specific details
        """

    @abstractmethod
    def verify_webhook(self, request) -> bool:
        """Verify an incoming webhook request is authentic.

        Args:
            request: Django HttpRequest

        Returns:
            True if the webhook is valid
        """

    @abstractmethod
    def parse_incoming(self, request) -> dict | None:
        """Parse an incoming webhook message.

        Args:
            request: Django HttpRequest

        Returns:
            dict with 'sender_id', 'content', 'sender_name', 'metadata'
            or None if the message should be ignored
        """

    def get_sender_info(self, sender_id: str) -> dict:
        """Get info about a sender. Override in subclass if supported."""
        return {'id': sender_id, 'name': sender_id}

    def health_check(self) -> dict:
        """Check if the channel is properly configured and reachable."""
        return {'status': 'ok', 'message': 'Health check not implemented'}
