from django.contrib import admin

from .models import AgentExecution, AgentMemory


@admin.register(AgentExecution)
class AgentExecutionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'lead', 'business', 'status', 'started_at',
        'completed_at', 'created_at',
    ]
    list_filter = ['status', 'business']
    search_fields = ['lead__name', 'business__name', 'error_message']
    readonly_fields = ['created_at', 'started_at', 'completed_at']
    raw_id_fields = ['lead', 'business', 'conversation']


@admin.register(AgentMemory)
class AgentMemoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'business', 'lead', 'memory_type', 'created_at', 'updated_at']
    list_filter = ['memory_type', 'business']
    search_fields = ['lead__name', 'business__name']
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['business', 'lead']
