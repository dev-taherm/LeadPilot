from django.contrib import admin
from .models import Business


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'industry', 'owner', 'is_active', 'created_at']
    list_filter = ['is_active', 'industry']
    search_fields = ['name', 'slug', 'industry']
    readonly_fields = ['id', 'created_at', 'updated_at']
    prepopulated_fields = {'slug': ('name',)}
