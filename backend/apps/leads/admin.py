from django.contrib import admin

from .models import Lead, LeadNote


class LeadNoteInline(admin.TabularInline):
    model = LeadNote
    extra = 0
    readonly_fields = ['created_by', 'created_at']


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'email', 'company', 'source', 'status',
        'score', 'assigned_to', 'created_at',
    ]
    list_filter = ['status', 'source', 'assigned_to']
    search_fields = ['name', 'email', 'phone', 'company']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [LeadNoteInline]


@admin.register(LeadNote)
class LeadNoteAdmin(admin.ModelAdmin):
    list_display = ['lead', 'created_by', 'created_at']
    list_filter = ['created_at']
    readonly_fields = ['created_at']
