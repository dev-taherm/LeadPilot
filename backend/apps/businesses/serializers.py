from rest_framework import serializers
from .models import Business


PROVIDER_DEFAULTS = {
    'openai': {'base_url': 'https://api.openai.com/v1', 'model': 'gpt-4o'},
    'openai_compatible': {'base_url': 'https://openrouter.ai/api/v1', 'model': 'openai/gpt-4o'},
    'anthropic': {'base_url': '', 'model': 'claude-sonnet-4-20250514'},
    'google': {'base_url': '', 'model': 'gemini-pro'},
    'mistral': {'base_url': '', 'model': 'mistral-large-latest'},
    'local': {'base_url': 'http://localhost:11434/v1', 'model': 'llama3'},
    'mock': {'base_url': '', 'model': ''},
}


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
    ai_api_key_display = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = [
            'ai_prompt_config',
            'ai_provider',
            'ai_api_key',
            'ai_api_key_display',
            'ai_base_url',
            'ai_model',
            'ai_temperature',
            'ai_max_tokens',
        ]
        extra_kwargs = {
            'ai_api_key': {'write_only': True},
        }

    def get_ai_api_key_display(self, obj):
        if obj.ai_api_key:
            return '****' + obj.ai_api_key[-4:] if len(obj.ai_api_key) > 4 else '****'
        return ''


class ProviderDefaultsSerializer(serializers.Serializer):
    provider = serializers.ChoiceField(choices=Business.ai_provider.field.choices)
