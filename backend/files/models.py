import os
from django.db import models
from django.core.validators import RegexValidator
from projects.models import Project


class Folder(models.Model):
    """Folder model for organizing files."""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='folders')
    name = models.CharField(max_length=255)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'folder'
        unique_together = ('project', 'parent', 'name')
        ordering = ['name']
        indexes = [
            models.Index(fields=['project', 'parent']),
        ]
    
    def __str__(self):
        if self.parent:
            return f"{self.parent}/{self.name}"
        return self.name
    
    @property
    def full_path(self):
        """Get full path of folder."""
        if self.parent:
            return f"{self.parent.full_path}/{self.name}"
        return self.name


class File(models.Model):
    """File model for storing code files."""
    # Path validator - allows alphanumeric, spaces, dots, slashes, hyphens, underscores
    path_validator = RegexValidator(
        regex=r'^[a-zA-Z0-9\s\.\/\-_]+$',
        message='File name can only contain alphanumeric characters, spaces, dots, slashes, hyphens, and underscores.'
    )
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='files')
    name = models.CharField(max_length=255, validators=[path_validator])
    path = models.CharField(max_length=1000, blank=True, help_text='Full path including folder structure')
    folder = models.ForeignKey(Folder, on_delete=models.SET_NULL, null=True, blank=True, related_name='files')
    content = models.TextField(blank=True, default='')
    language = models.CharField(max_length=50, default='javascript', help_text='Programming language')
    encoding = models.CharField(max_length=20, default='utf-8')
    size = models.IntegerField(default=0, help_text='File size in bytes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, related_name='created_files')
    updated_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, related_name='updated_files')
    
    class Meta:
        db_table = 'file'
        unique_together = ('project', 'path', 'name')
        ordering = ['path', 'name']
        indexes = [
            models.Index(fields=['project', 'folder']),
            models.Index(fields=['project', 'language']),
            models.Index(fields=['project', '-updated_at']),
        ]
    
    def __str__(self):
        if self.path:
            return f"{self.project.name}/{self.path}/{self.name}"
        return f"{self.project.name}/{self.name}"
    
    def save(self, *args, **kwargs):
        """Override save to update path and size."""
        # Update path based on folder
        if self.folder:
            self.path = self.folder.full_path
        else:
            self.path = ''
        
        # Update size based on content
        if self.content:
            self.size = len(self.content.encode(self.encoding))
        else:
            self.size = 0
        
        # Detect language from file extension if not set
        if not self.language or self.language == 'javascript':
            self.language = self._detect_language()
        
        super().save(*args, **kwargs)
    
    def _detect_language(self):
        """Detect programming language from file extension."""
        extension_map = {
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.cs': 'csharp',
            '.php': 'php',
            '.rb': 'ruby',
            '.go': 'go',
            '.rs': 'rust',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.sass': 'sass',
            '.json': 'json',
            '.xml': 'xml',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.md': 'markdown',
            '.sql': 'sql',
            '.sh': 'shell',
            '.bash': 'shell',
            '.zsh': 'shell',
            '.ps1': 'powershell',
            '.dockerfile': 'dockerfile',
            '.dockerignore': 'plaintext',
            '.gitignore': 'plaintext',
            '.env': 'plaintext',
        }
        
        _, ext = os.path.splitext(self.name.lower())
        return extension_map.get(ext, 'plaintext')
    
    @property
    def full_path(self):
        """Get full path of file."""
        if self.path:
            return f"{self.path}/{self.name}".strip('/')
        return self.name
    
    @property
    def line_count(self):
        """Get number of lines in file."""
        if self.content:
            return len(self.content.splitlines())
        return 0
