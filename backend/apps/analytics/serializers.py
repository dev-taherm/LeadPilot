from rest_framework import serializers

from .models import AnalyticsSnapshot


class AnalyticsSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsSnapshot
        fields = [
            'id', 'business', 'date', 'total_leads', 'new_leads',
            'qualified_leads', 'meetings_booked', 'conversion_rate',
            'avg_response_time', 'ai_interactions', 'active_conversations',
            'created_at',
        ]
        read_only_fields = ['business', 'created_at']


class DashboardSerializer(serializers.Serializer):
    date = serializers.DateField()
    total_leads = serializers.IntegerField()
    new_leads = serializers.IntegerField()
    qualified_leads = serializers.IntegerField()
    meetings_booked = serializers.IntegerField()
    conversion_rate = serializers.FloatField()
    avg_response_time = serializers.FloatField()
    ai_interactions = serializers.IntegerField()
    active_conversations = serializers.IntegerField()
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    trend = serializers.DictField()
