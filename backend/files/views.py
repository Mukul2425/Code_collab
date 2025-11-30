from rest_framework import viewsets, permissions
from .models import File
from .serializers import FileSerializer

class FileViewSet(viewsets.ModelViewSet):
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return File.objects.filter(project__owner=self.request.user)
