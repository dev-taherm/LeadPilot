from rest_framework import serializers

from .models import Lead, LeadNote


class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = [
            'id', 'business', 'name', 'email', 'phone', 'company',
            'source', 'status', 'score', 'assigned_to', 'notes',
            'tags', 'created_at', 'updated_at',
        ]
        read_only_fields = ['business', 'created_at', 'updated_at']


class LeadListSerializer(serializers.ModelSerializer):
    assigned_to = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = [
            'id', 'name', 'email', 'phone', 'company', 'status',
            'score', 'source', 'assigned_to', 'created_at',
        ]

    def get_assigned_to(self, obj):
        if obj.assigned_to:
            return {'id': obj.assigned_to.id, 'name': obj.assigned_to.get_full_name()}
        return None


class LeadCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = [
            'name', 'email', 'phone', 'company', 'source', 'status',
            'score', 'assigned_to', 'notes', 'tags',
        ]


class LeadNoteSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()

    class Meta:
        model = LeadNote
        fields = ['id', 'lead', 'content', 'created_by', 'created_at']
        read_only_fields = ['lead', 'created_by', 'created_at']

    def get_created_by(self, obj):
        if obj.created_by:
            return {'id': obj.created_by.id, 'name': obj.created_by.get_full_name()}
        return None


class LeadNoteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadNote
        fields = ['content']
