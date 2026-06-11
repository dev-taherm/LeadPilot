from rest_framework import serializers

from .models import ChannelIntegration


class ChannelIntegrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChannelIntegration
        fields = [
            'id', 'business', 'channel_type', 'name', 'is_active',
            'config', 'webhook_secret', 'status', 'last_error',
            'last_connected_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['business', 'status', 'last_error', 'last_connected_at', 'created_at', 'updated_at']
        extra_kwargs = {
            'config': {'write_only': False},
        }

    def validate_config(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('Config must be a dictionary')
        return value


class ChannelIntegrationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChannelIntegration
        fields = [
            'channel_type', 'name', 'config', 'webhook_secret', 'is_active',
        ]
