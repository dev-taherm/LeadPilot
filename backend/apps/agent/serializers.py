from rest_framework import serializers

from .models import AgentExecution, AgentMemory


class AgentRunSerializer(serializers.Serializer):
    lead_id = serializers.UUIDField()


class AgentExecutionSerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.name', read_only=True)
    business_name = serializers.CharField(source='business.name', read_only=True)

    class Meta:
        model = AgentExecution
        fields = [
            'id', 'lead', 'lead_name', 'business', 'business_name',
            'conversation', 'status', 'input_data', 'output_data',
            'error_message', 'started_at', 'completed_at', 'created_at',
        ]
        read_only_fields = fields


class AgentMemorySerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.name', read_only=True, default=None)
    business_name = serializers.CharField(source='business.name', read_only=True)

    class Meta:
        model = AgentMemory
        fields = [
            'id', 'business', 'business_name', 'lead', 'lead_name',
            'memory_type', 'content', 'created_at', 'updated_at',
        ]
        read_only_fields = fields
