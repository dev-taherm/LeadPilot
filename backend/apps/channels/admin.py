from django.contrib import admin

from .models import ChannelIntegration


@admin.register(ChannelIntegration)
class ChannelIntegrationAdmin(admin.ModelAdmin):
    list_display = ['name', 'channel_type', 'business', 'status', 'is_active', 'created_at']
    list_filter = ['channel_type', 'status', 'is_active']
    search_fields = ['name', 'business__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
