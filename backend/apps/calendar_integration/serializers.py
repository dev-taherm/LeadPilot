from rest_framework import serializers

from .models import CalendarEvent, CalendarIntegration


class CalendarIntegrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarIntegration
        fields = [
            'id', 'business', 'provider', 'credentials',
            'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['business', 'created_at', 'updated_at']


class CalendarEventSerializer(serializers.ModelSerializer):
    lead_name = serializers.SerializerMethodField()

    class Meta:
        model = CalendarEvent
        fields = [
            'id', 'business', 'lead', 'lead_name', 'conversation',
            'title', 'description', 'start_time', 'end_time',
            'status', 'external_id', 'metadata', 'created_at', 'updated_at',
        ]
        read_only_fields = ['business', 'external_id', 'created_at', 'updated_at']

    def get_lead_name(self, obj):
        if obj.lead:
            return obj.lead.name
        return None


class CalendarEventCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarEvent
        fields = [
            'lead', 'conversation', 'title', 'description',
            'start_time', 'end_time', 'metadata',
        ]
