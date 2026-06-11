from django.contrib import admin

from .models import Conversation, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ['sender_type', 'sender_id', 'content', 'channel', 'is_ai_generated', 'metadata', 'created_at']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'lead', 'business', 'status', 'channel',
        'ai_paused', 'assigned_to', 'last_message_at', 'created_at',
    ]
    list_filter = ['status', 'channel', 'ai_paused', 'created_at']
    search_fields = ['lead__name', 'lead__email']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [MessageInline]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation', 'sender_type', 'sender_id', 'content', 'channel', 'is_ai_generated', 'created_at']
    list_filter = ['sender_type', 'channel', 'is_ai_generated', 'created_at']
    search_fields = ['content']
    readonly_fields = ['created_at']
