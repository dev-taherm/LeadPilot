from django.contrib import admin

from .models import KnowledgeDocument


@admin.register(KnowledgeDocument)
class KnowledgeDocumentAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'business', 'document_type', 'is_indexed',
        'created_at',
    ]
    list_filter = ['document_type', 'is_indexed', 'created_at']
    search_fields = ['title', 'content']
    readonly_fields = ['created_at', 'updated_at']
