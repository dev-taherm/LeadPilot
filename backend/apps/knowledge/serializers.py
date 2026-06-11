from rest_framework import serializers

from .models import KnowledgeDocument


class KnowledgeDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeDocument
        fields = [
            'id', 'business', 'title', 'file', 'content',
            'document_type', 'is_indexed', 'metadata',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['business', 'is_indexed', 'created_at', 'updated_at']


class KnowledgeDocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeDocument
        fields = ['title', 'file', 'document_type']
