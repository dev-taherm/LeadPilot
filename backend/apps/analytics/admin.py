from django.contrib import admin

from .models import AnalyticsSnapshot


@admin.register(AnalyticsSnapshot)
class AnalyticsSnapshotAdmin(admin.ModelAdmin):
    list_display = [
        'business', 'date', 'total_leads', 'new_leads',
        'qualified_leads', 'meetings_booked', 'conversion_rate',
        'active_conversations',
    ]
    list_filter = ['date']
    readonly_fields = ['created_at']
