from django.db import models
from projects.models import Project

class File(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='files')
    name = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    language = models.CharField(max_length=50, default='javascript')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('project', 'name')

    def __str__(self):
        return f"{self.project.name}/{self.name}"
