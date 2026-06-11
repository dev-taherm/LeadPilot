from rest_framework import serializers

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender_type', 'sender_id', 'content',
            'channel', 'is_ai_generated', 'metadata', 'created_at',
        ]
        read_only_fields = ['conversation', 'created_at']


class MessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['content', 'channel']
        extra_kwargs = {
            'channel': {'default': 'web'},
        }


class ConversationSerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.name', read_only=True)
    lead_email = serializers.CharField(source='lead.email', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    last_message_preview = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'business', 'lead', 'lead_name', 'lead_email', 'status',
            'channel', 'ai_paused', 'assigned_to', 'assigned_to_name',
            'last_message_at', 'last_message_preview', 'created_at', 'updated_at',
        ]
        read_only_fields = ['business', 'created_at', 'updated_at']

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name()
        return None

    def get_last_message_preview(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return {
                'content': last_msg.content[:200],
                'sender_type': last_msg.sender_type,
                'created_at': last_msg.created_at,
            }
        return None


class ConversationDetailSerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.name', read_only=True)
    lead_email = serializers.CharField(source='lead.email', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    messages = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'business', 'lead', 'lead_name', 'lead_email', 'status',
            'channel', 'ai_paused', 'assigned_to', 'assigned_to_name',
            'last_message_at', 'messages', 'created_at', 'updated_at',
        ]
        read_only_fields = ['business', 'created_at', 'updated_at']

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name()
        return None

    def get_messages(self, obj):
        messages = obj.messages.all()[:20]
        return MessageSerializer(messages, many=True).data


class ConversationListSerializer(serializers.ModelSerializer):
    lead = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'lead', 'status', 'channel', 'ai_paused',
            'last_message_at', 'unread_count',
        ]

    def get_lead(self, obj):
        return {
            'id': obj.lead.id,
            'name': obj.lead.name,
            'email': obj.lead.email,
        }

    def get_unread_count(self, obj):
        if not hasattr(obj, '_unread_count'):
            return 0
        return obj._unread_count
