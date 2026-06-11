from rest_framework import serializers
from .models import Business


class BusinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = [
            'id', 'name', 'slug', 'logo', 'website', 'industry',
            'description', 'services', 'faq', 'timezone',
            'operating_hours', 'ai_prompt_config', 'owner',
            'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['owner', 'created_at', 'updated_at']


class BusinessPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = ['id', 'name', 'slug', 'industry', 'description']


class AIConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = ['ai_prompt_config']
