import uuid

from django.db import models


class ChannelIntegration(models.Model):
    class ChannelType(models.TextChoices):
        WHATSAPP = 'whatsapp', 'WhatsApp'
        TELEGRAM = 'telegram', 'Telegram'
        SMS = 'sms', 'SMS (Twilio)'
        EMAIL = 'email', 'Email'
        SLACK = 'slack', 'Slack'
        DISCORD = 'discord', 'Discord'
        INSTAGRAM = 'instagram', 'Instagram DM'
        FACEBOOK = 'facebook', 'Facebook Messenger'

    class Status(models.TextChoices):
        CONNECTED = 'connected', 'Connected'
        DISCONNECTED = 'disconnected', 'Disconnected'
        ERROR = 'error', 'Error'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        'businesses.Business',
        on_delete=models.CASCADE,
        related_name='channel_integrations',
    )
    channel_type = models.CharField(max_length=20, choices=ChannelType.choices)
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    config = models.JSONField(default=dict, blank=True)
    webhook_secret = models.CharField(max_length=255, blank=True, default='')

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DISCONNECTED,
    )
    last_error = models.TextField(blank=True, default='')
    last_connected_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['business', 'channel_type', 'name']

    def __str__(self):
        return f"{self.get_channel_type_display()} - {self.name} ({self.status})"
