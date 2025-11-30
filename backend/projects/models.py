from django.db import models
from django.contrib.auth.models import User


class Project(models.Model):
    """Project model for organizing code files."""
    VISIBILITY_CHOICES = [
        ('private', 'Private'),
        ('public', 'Public'),
        ('shared', 'Shared'),
    ]
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_projects')
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='private')
    default_language = models.CharField(max_length=50, default='javascript', help_text='Default language for new files')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'project'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['owner', '-updated_at']),
            models.Index(fields=['visibility']),
        ]
    
    def __str__(self):
        return self.name
    
    @property
    def file_count(self):
        """Get total number of files in project."""
        return self.files.count()
    
    @property
    def folder_count(self):
        """Get total number of folders in project."""
        return self.folders.count()
