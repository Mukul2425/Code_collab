from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """Admin interface for Project model."""
    list_display = ('name', 'owner', 'visibility', 'default_language', 
                    'file_count', 'folder_count', 'created_at', 'updated_at')
    list_filter = ('visibility', 'default_language', 'created_at')
    search_fields = ('name', 'description', 'owner__username', 'owner__email')
    readonly_fields = ('created_at', 'updated_at', 'file_count', 'folder_count')
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'owner')
        }),
        ('Settings', {
            'fields': ('visibility', 'default_language')
        }),
        ('Statistics', {
            'fields': ('file_count', 'folder_count'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def file_count(self, obj):
        """Display file count."""
        return obj.file_count
    file_count.short_description = 'Files'
    
    def folder_count(self, obj):
        """Display folder count."""
        return obj.folder_count
    folder_count.short_description = 'Folders'
