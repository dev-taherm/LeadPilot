from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'business', 'title', 'message',
            'notification_type', 'is_read', 'link', 'metadata',
            'created_at',
        ]
        read_only_fields = ['user', 'business', 'created_at']


class NotificationListSerializer(serializers.ModelSerializer):
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type',
            'is_read', 'link', 'metadata', 'created_at', 'unread_count',
        ]

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return Notification.objects.filter(
                user=request.user,
                is_read=False,
            ).count()
        return 0
