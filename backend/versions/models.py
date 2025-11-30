from django.db import models
from django.contrib.auth.models import User
from files.models import File

class Version(models.Model):
    file = models.ForeignKey(File, on_delete=models.CASCADE, related_name='versions')
    content = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.file.name} - {self.created_at}"
