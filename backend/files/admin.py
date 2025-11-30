from django.contrib import admin
from .models import File, Folder


@admin.register(Folder)
class FolderAdmin(admin.ModelAdmin):
    """Admin interface for Folder model."""
    list_display = ('name', 'project', 'parent', 'full_path', 
                    'children_count', 'files_count', 'created_at')
    list_filter = ('project', 'created_at')
    search_fields = ('name', 'project__name', 'full_path')
    readonly_fields = ('full_path', 'children_count', 'files_count', 
                      'created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'project', 'parent')
        }),
        ('Statistics', {
            'fields': ('children_count', 'files_count'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def children_count(self, obj):
        """Display children count."""
        return obj.children.count()
    children_count.short_description = 'Subfolders'
    
    def files_count(self, obj):
        """Display files count."""
        return obj.files.count()
    files_count.short_description = 'Files'


@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    """Admin interface for File model."""
    list_display = ('name', 'project', 'folder', 'language', 'size', 
                    'line_count', 'created_by', 'updated_at')
    list_filter = ('language', 'project', 'created_at', 'updated_at')
    search_fields = ('name', 'path', 'project__name', 'content')
    readonly_fields = ('full_path', 'size', 'line_count', 'created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'project', 'folder', 'path', 'full_path')
        }),
        ('Content', {
            'fields': ('content', 'language', 'encoding')
        }),
        ('Metadata', {
            'fields': ('size', 'line_count', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def line_count(self, obj):
        """Display line count."""
        return obj.line_count
    line_count.short_description = 'Lines'
