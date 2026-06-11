from django.contrib import admin

from .models import CalendarEvent, CalendarIntegration


@admin.register(CalendarIntegration)
class CalendarIntegrationAdmin(admin.ModelAdmin):
    list_display = ['provider', 'business', 'is_active', 'created_at']
    list_filter = ['provider', 'is_active']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'business', 'lead', 'status',
        'start_time', 'end_time', 'created_at',
    ]
    list_filter = ['status', 'start_time']
    search_fields = ['title', 'description']
    readonly_fields = ['external_id', 'created_at', 'updated_at']
