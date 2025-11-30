from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Version
from .serializers import VersionSerializer
from files.models import File

class VersionViewSet(viewsets.ModelViewSet):
    serializer_class = VersionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter versions by file if 'file_id' is provided in query params
        queryset = Version.objects.all()
        file_id = self.request.query_params.get('file_id')
        if file_id:
            queryset = queryset.filter(file_id=file_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def revert(self, request, pk=None):
        version = self.get_object()
        file = version.file
        
        # Create a new version of the current state before reverting (safety)
        Version.objects.create(
            file=file,
            content=file.content,
            created_by=request.user,
            description=f"Auto-save before revert to {version.created_at}"
        )

        # Update file content
        file.content = version.content
        file.save()

        return Response({'status': 'reverted', 'content': file.content})
